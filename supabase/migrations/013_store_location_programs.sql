-- "Apply to cards": lets a merchant scope a location's geo-push to specific
-- loyalty programs instead of every pass they issue. No rows for a location
-- means "applies to all programs" (the pre-migration behavior), so existing
-- locations keep working unchanged.

create table public.store_location_programs (
  store_location_id uuid not null references public.store_locations(id) on delete cascade,
  program_id uuid not null references public.loyalty_programs(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (store_location_id, program_id)
);

create index store_location_programs_location_idx on public.store_location_programs(store_location_id);
create index store_location_programs_program_idx on public.store_location_programs(program_id);

alter table public.store_location_programs enable row level security;

create policy "merchants and staff access store_location_programs"
on public.store_location_programs for all
using (
  exists (
    select 1 from public.store_locations sl
    where sl.id = store_location_id
      and (sl.merchant_id = auth.uid() or public.is_active_staff_of(sl.merchant_id))
  )
)
with check (
  exists (
    select 1 from public.store_locations sl
    where sl.id = store_location_id
      and (sl.merchant_id = auth.uid() or public.is_active_staff_of(sl.merchant_id))
  )
);
