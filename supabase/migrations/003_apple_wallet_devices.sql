-- Support for the real Apple PassKit Web Service protocol:
-- per-pass authentication tokens + device push-token registrations
-- (a pass can be added on multiple devices, each needs its own registration).

alter table public.customer_progress
  add column if not exists apple_auth_token text not null default encode(gen_random_bytes(16), 'hex');

create table if not exists public.apple_device_registrations (
  id uuid primary key default gen_random_uuid(),
  device_library_identifier text not null,
  pass_type_identifier text not null,
  serial_number uuid not null references public.customer_progress(pass_id) on delete cascade,
  push_token text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (device_library_identifier, serial_number)
);

create index if not exists apple_device_registrations_serial_number_idx
  on public.apple_device_registrations(serial_number);

create trigger apple_device_registrations_set_updated_at
before update on public.apple_device_registrations
for each row execute function public.set_updated_at();

-- Only ever accessed via the Supabase service role key (PassKit web
-- service endpoints are public and authenticate via the pass's own
-- authenticationToken, not a merchant session) — RLS with no policies
-- blocks the anon/authenticated roles entirely, service role bypasses it.
alter table public.apple_device_registrations enable row level security;
