-- scan_events.scanned_by was defined (001_initial_schema.sql) as
-- `references public.merchants(id)`, which only worked by coincidence
-- before staff accounts existed -- the only possible scanner was the
-- merchant owner, whose id IS a merchants.id.
--
-- 005_staff_accounts.sql updated the RLS policies to let staff scan (its
-- own comment even predicted this: "scanned_by is the staff member's id"),
-- but never updated this underlying foreign key. A staff member's
-- auth.uid() is never a row in `merchants`, only in `auth.users` -- so
-- every scan performed by a non-owner staff member has been violating
-- scan_events_scanned_by_fkey ever since staff scanning shipped (Phase 3).
--
-- Re-pointing at auth.users(id) is safe for existing rows: every owner's
-- id is already both a merchants.id and an auth.users.id (merchant
-- accounts ARE auth.users rows, per 001_initial_schema.sql), so no
-- existing scan_events row can fail the new constraint.

alter table public.scan_events
  drop constraint scan_events_scanned_by_fkey;

alter table public.scan_events
  add constraint scan_events_scanned_by_fkey
  foreign key (scanned_by) references auth.users(id) on delete cascade;
