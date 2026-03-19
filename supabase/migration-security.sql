-- Security Hardening Migration
-- Run this in your Supabase SQL Editor

-- ============================================
-- Atomic credit deduction function
-- Prevents race conditions on concurrent requests
-- ============================================
create or replace function public.deduct_credit(agent_uuid uuid)
returns boolean
language sql
as $$
  update public.agents
  set credits = credits - 1
  where id = agent_uuid and credits > 0
  returning true;
$$;
