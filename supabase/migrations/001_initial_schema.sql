-- StampWallet initial schema
create extension if not exists "pgcrypto";

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- merchants
create table public.merchants (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null default '',
  industry text not null default '',
  logo_url text,
  brand_color_primary text not null default '#3E0856',
  brand_color_secondary text not null default '#FAAE62',
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'enterprise')),
  stripe_customer_id text,
  locale_default text not null default 'en' check (locale_default in ('en', 'ar')),
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger merchants_set_updated_at
before update on public.merchants
for each row execute function public.set_updated_at();

-- loyalty_programs
create table public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  type text not null check (type in ('stamp', 'points', 'steps')),
  is_active boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index loyalty_programs_merchant_id_idx on public.loyalty_programs(merchant_id);

create trigger loyalty_programs_set_updated_at
before update on public.loyalty_programs
for each row execute function public.set_updated_at();

-- customers
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text,
  phone text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index customers_merchant_id_idx on public.customers(merchant_id);

create trigger customers_set_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

-- customer_progress
create table public.customer_progress (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  program_id uuid not null references public.loyalty_programs(id) on delete cascade,
  pass_id uuid not null unique default gen_random_uuid(),
  progress jsonb not null default '{}'::jsonb,
  apple_push_token text,
  google_object_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (customer_id, program_id)
);

create index customer_progress_program_id_idx on public.customer_progress(program_id);
create unique index customer_progress_pass_id_idx on public.customer_progress(pass_id);

create trigger customer_progress_set_updated_at
before update on public.customer_progress
for each row execute function public.set_updated_at();

-- scan_events
create table public.scan_events (
  id uuid primary key default gen_random_uuid(),
  customer_progress_id uuid not null references public.customer_progress(id) on delete cascade,
  scanned_by uuid not null references public.merchants(id) on delete cascade,
  delta jsonb not null default '{}'::jsonb,
  resulted_in_reward boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scan_events_customer_progress_id_idx on public.scan_events(customer_progress_id);

create trigger scan_events_set_updated_at
before update on public.scan_events
for each row execute function public.set_updated_at();

-- redemptions
create table public.redemptions (
  id uuid primary key default gen_random_uuid(),
  customer_progress_id uuid not null references public.customer_progress(id) on delete cascade,
  reward_description text not null,
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger redemptions_set_updated_at
before update on public.redemptions
for each row execute function public.set_updated_at();

-- RLS
alter table public.merchants enable row level security;
alter table public.loyalty_programs enable row level security;
alter table public.customers enable row level security;
alter table public.customer_progress enable row level security;
alter table public.scan_events enable row level security;
alter table public.redemptions enable row level security;

create policy "merchants access own row"
on public.merchants for all
using (id = auth.uid())
with check (id = auth.uid());

create policy "merchants access own programs"
on public.loyalty_programs for all
using (merchant_id = auth.uid())
with check (merchant_id = auth.uid());

create policy "merchants access own customers"
on public.customers for all
using (merchant_id = auth.uid())
with check (merchant_id = auth.uid());

create policy "merchants access own customer_progress"
on public.customer_progress for all
using (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = customer_progress.program_id
      and p.merchant_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.loyalty_programs p
    where p.id = customer_progress.program_id
      and p.merchant_id = auth.uid()
  )
);

create policy "merchants access own scan_events"
on public.scan_events for all
using (scanned_by = auth.uid())
with check (scanned_by = auth.uid());

create policy "merchants access own redemptions"
on public.redemptions for all
using (
  exists (
    select 1
    from public.customer_progress cp
    join public.loyalty_programs p on p.id = cp.program_id
    where cp.id = redemptions.customer_progress_id
      and p.merchant_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.customer_progress cp
    join public.loyalty_programs p on p.id = cp.program_id
    where cp.id = redemptions.customer_progress_id
      and p.merchant_id = auth.uid()
  )
);

-- Auto-create merchant row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.merchants (id, business_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'business_name', ''));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Storage bucket for logos (run in dashboard or via storage API)
-- insert into storage.buckets (id, name, public) values ('logos', 'logos', true);
