-- Phase 1 hardening:
-- 1. google_auth_token — mirrors apple_auth_token, closes the same IDOR gap
--    on the Google Wallet save-link endpoint (anyone with a pass_id could
--    otherwise regenerate another merchant's customer's wallet link).
-- 2. rate_limits — replaces the in-process Map in lib/rate-limit.ts, which
--    does not work across multiple serverless instances (each instance has
--    its own empty map, so rate limiting was effectively a no-op in
--    production). Service-role only, matching apple_device_registrations.

alter table public.customer_progress
  add column if not exists google_auth_token text not null default encode(gen_random_bytes(16), 'hex');

create table if not exists public.rate_limits (
  key text primary key,
  last_hit timestamptz not null default now()
);

alter table public.rate_limits enable row level security;

-- Atomic check-and-record: returns true (allowed) and records the hit if the
-- key hasn't been hit within window_ms; returns false (blocked) otherwise.
-- FOR UPDATE row lock makes this safe under concurrent requests for the
-- same key.
create or replace function public.check_rate_limit(p_key text, p_window_ms integer)
returns boolean
language plpgsql
as $$
declare
  v_last timestamptz;
begin
  select last_hit into v_last from public.rate_limits where key = p_key for update;

  if v_last is not null and now() - v_last < make_interval(secs => p_window_ms / 1000.0) then
    return false;
  end if;

  insert into public.rate_limits (key, last_hit)
  values (p_key, now())
  on conflict (key) do update set last_hit = now();

  return true;
end;
$$;
