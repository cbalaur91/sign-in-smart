-- Stripe Payment Integration Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- Add billing fields to agents table
-- ============================================
alter table public.agents
  add column stripe_customer_id text,
  add column credits integer not null default 1;

-- ============================================
-- Update events status constraint to include pending_payment
-- ============================================
alter table public.events
  drop constraint events_status_check;

alter table public.events
  add constraint events_status_check
  check (status in ('draft', 'active', 'completed', 'pending_payment'));

-- ============================================
-- Table: payments
-- ============================================
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id text,
  amount_cents integer not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'expired', 'refunded')),
  created_at timestamptz not null default now()
);

create index idx_payments_agent_id on public.payments(agent_id);
create index idx_payments_event_id on public.payments(event_id);
create index idx_payments_checkout_session on public.payments(stripe_checkout_session_id);

alter table public.payments enable row level security;

create policy "Agents can view own payments"
  on public.payments for select
  using (auth.uid() = agent_id);
