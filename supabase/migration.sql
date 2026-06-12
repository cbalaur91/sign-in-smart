-- OpenHouse.ai — Supabase Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- Table: agents
-- ============================================
create table public.agents (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text,
  brokerage text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.agents enable row level security;

create policy "Agents can read own profile"
  on public.agents for select
  using (auth.uid() = id);

create policy "Agents can update own profile"
  on public.agents for update
  using (auth.uid() = id);

create policy "Agents can insert own profile"
  on public.agents for insert
  with check (auth.uid() = id);

-- ============================================
-- Table: events
-- ============================================
create table public.events (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.agents(id) on delete cascade,
  slug text not null unique,
  property_address text not null,
  city text not null,
  state text not null,
  zip text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  description text,
  photos text[] not null default '{}',
  bedrooms integer,
  bathrooms numeric(3,1),
  sqft integer,
  price numeric(12,2),
  status text not null default 'draft' check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default now()
);

create index idx_events_agent_id on public.events(agent_id);
create index idx_events_slug on public.events(slug);
create index idx_events_status on public.events(status);

alter table public.events enable row level security;

create policy "Agents can CRUD own events"
  on public.events for all
  using (auth.uid() = agent_id);

create policy "Public can view active events"
  on public.events for select
  using (status = 'active');

-- ============================================
-- Table: visitors
-- ============================================
create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone text not null,
  visitor_type text not null default 'other' check (visitor_type in ('buyer', 'neighbor', 'investor', 'other')),
  notes text,
  signed_in_at timestamptz not null default now()
);

create index idx_visitors_event_id on public.visitors(event_id);
create index idx_visitors_email_event on public.visitors(email, event_id);

alter table public.visitors enable row level security;

-- Public can insert (visitor sign-in form)
create policy "Anyone can sign in as visitor"
  on public.visitors for insert
  with check (true);

-- Agents can view visitors for their own events
create policy "Agents can view own event visitors"
  on public.visitors for select
  using (
    exists (
      select 1 from public.events
      where events.id = visitors.event_id
      and events.agent_id = auth.uid()
    )
  );

-- ============================================
-- Table: event_analytics
-- ============================================
create table public.event_analytics (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  event_type text not null,
  visitor_id uuid references public.visitors(id) on delete set null,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index idx_event_analytics_event_id on public.event_analytics(event_id);

alter table public.event_analytics enable row level security;

-- Public can insert analytics events
create policy "Anyone can track analytics"
  on public.event_analytics for insert
  with check (true);

-- Agents can view analytics for their own events
create policy "Agents can view own event analytics"
  on public.event_analytics for select
  using (
    exists (
      select 1 from public.events
      where events.id = event_analytics.event_id
      and events.agent_id = auth.uid()
    )
  );

-- ============================================
-- Enable Realtime for visitors table
-- ============================================
alter publication supabase_realtime add table public.visitors;

-- ============================================
-- Storage bucket for property photos
-- ============================================
-- Note: Create a public bucket named "property-photos" in Supabase Dashboard > Storage
-- Or run this if using the SQL editor with storage admin access:
-- insert into storage.buckets (id, name, public) values ('property-photos', 'property-photos', true);

-- ============================================
-- Sign-up flow: agent name columns + profile-creation trigger
-- (applied via MCP migration: add_agent_name_columns_and_signup_trigger)
-- ============================================
alter table public.agents
  add column if not exists first_name text,
  add column if not exists last_name text;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.agents (id, full_name, first_name, last_name, phone, email)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''),
             split_part(new.email, '@', 1), 'Agent'),
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'phone',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger-only function: not callable via the REST RPC endpoint
revoke execute on function public.handle_new_user() from anon, authenticated, public;

-- ============================================
-- Per-event timezone (applied via MCP migration: add_event_timezone)
-- date/start_time/end_time are wall-clock values in this IANA zone
-- ============================================
alter table public.events
  add column if not exists timezone text not null default 'America/Chicago';
