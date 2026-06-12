-- SignInSmart — Follow-up emails + seller report migration
-- Spec: docs/spec-follow-up-and-seller-report.md
-- Run this in your Supabase SQL Editor (or apply via MCP/CLI)

-- ============================================
-- events: follow-up toggles, completion timestamp, report token
-- ============================================
alter table public.events
  add column if not exists follow_up_enabled boolean not null default true,
  add column if not exists nudge_enabled boolean not null default true,
  add column if not exists completed_at timestamptz,
  add column if not exists report_token uuid not null default gen_random_uuid();

-- completed_at stays null for events completed before this ships,
-- so the email cron never back-fills sends to historical events.

create unique index if not exists idx_events_report_token
  on public.events(report_token);

-- ============================================
-- visitors: unsubscribe flag
-- ============================================
alter table public.visitors
  add column if not exists email_opt_out boolean not null default false;

-- ============================================
-- Table: email_log — idempotency ledger for the follow-up cron
-- ============================================
create table if not exists public.email_log (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  visitor_id uuid not null references public.visitors(id) on delete cascade,
  email_type text not null check (email_type in ('thank_you', 'nudge')),
  status text not null default 'sent' check (status in ('sent', 'failed')),
  attempts int not null default 1,
  resend_id text,
  created_at timestamptz not null default now(),
  unique (visitor_id, email_type)
);

create index if not exists idx_email_log_event_id on public.email_log(event_id);

alter table public.email_log enable row level security;

-- Agents can read send history for their own events; all writes are
-- server-side via the admin (service role) client — no public access.
create policy "Agents can view own event email log"
  on public.email_log for select
  using (
    exists (
      select 1 from public.events
      where events.id = email_log.event_id
      and events.agent_id = auth.uid()
    )
  );
