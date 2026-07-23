-- Phase 9: geolocation, delivered the same wallet-native way as Phase 8's
-- notifications — no separate customer app or polling service. Both
-- PassKit and Google Wallet natively show a pass on the lock screen when
-- the device is physically near coordinates embedded on the pass itself
-- (passkit-generator's Location type / Google Wallet's loyaltyObject
-- `locations`), so this table just needs to exist and get read by
-- lib/wallet/apple.ts and google.ts at pass-generation time.

create table public.store_locations (
  id uuid primary key default gen_random_uuid(),
  merchant_id uuid not null references public.merchants(id) on delete cascade,
  name text not null,
  address text,
  latitude double precision not null,
  longitude double precision not null,
  radius_meters integer not null default 150,
  relevant_text text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index store_locations_merchant_id_idx on public.store_locations(merchant_id);

create trigger store_locations_set_updated_at
before update on public.store_locations
for each row execute function public.set_updated_at();

alter table public.store_locations enable row level security;

create policy "merchants and staff access store_locations"
on public.store_locations for all
using (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id))
with check (merchant_id = auth.uid() or public.is_active_staff_of(merchant_id));
