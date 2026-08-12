-- lib/api.ts's resolveSession() flips a staff member's own row from
-- 'invited' to 'active' the first time they successfully authenticate —
-- using their OWN session-bound client, not the admin client, so it's
-- subject to RLS. 005_staff_accounts.sql's "owner and admins manage staff
-- accounts" policy only lets the owner or an *already-active admin* write
-- to staff_accounts; a staff member has no policy allowing them to touch
-- their own row at all beyond the existing SELECT-only "staff read own
-- row" policy. That UPDATE was therefore silently blocked by RLS for every
-- non-admin invite (manager/staff roles) — status stayed 'invited'
-- forever, which means is_active_staff_of() always returns false for
-- them, which means every RLS policy gating loyalty_programs/customers/
-- customer_progress/scan_events/redemptions on active-staff status also
-- always denies them. A real invited staff member could sign in but would
-- see an entirely empty, effectively locked-out account with no error
-- explaining why — exactly the "no access" behavior reported after the
-- staff invite email delivery bug (previous migration) was fixed and
-- someone could finally complete the flow for the first time.

drop policy if exists "staff self-activate own row" on public.staff_accounts;
create policy "staff self-activate own row"
on public.staff_accounts for update
using (user_id = auth.uid() and status = 'invited')
with check (user_id = auth.uid() and status = 'active');

-- RLS's WITH CHECK only sees the proposed new row, not what changed
-- relative to the old one — the policy above alone can't stop a staff
-- member from also smuggling role='admin' (or a different merchant_id)
-- into the same self-activation UPDATE. A trigger has access to both
-- OLD and NEW, so it's what actually enforces "status is the only column
-- this policy is allowed to change" — anyone who already passes
-- can_manage_staff (owner/active admin) is unrestricted, as before.
create or replace function public.enforce_staff_self_activate_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.can_manage_staff(old.merchant_id) then
    if new.role <> old.role or new.merchant_id <> old.merchant_id or new.invited_email <> old.invited_email then
      raise exception 'Only status may be changed via self-activation';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists staff_accounts_enforce_self_activate_only on public.staff_accounts;
create trigger staff_accounts_enforce_self_activate_only
before update on public.staff_accounts
for each row execute function public.enforce_staff_self_activate_only();
