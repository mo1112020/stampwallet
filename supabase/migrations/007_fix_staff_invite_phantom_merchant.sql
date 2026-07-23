-- Real bug found via live testing during Phase 3 (not caught by static
-- review): handle_new_user() (migration 001) fires on every insert into
-- auth.users, including ones created by auth.admin.inviteUserByEmail for
-- staff invites (migration 005/Phase 2). That means every invited staff
-- member also got a blank "owner" merchants row auto-created for them —
-- and requireSession() (lib/api.ts) checks "do I own a merchant row"
-- *before* checking staff_accounts, so an invited staff member would be
-- silently treated as the owner of an empty phantom account instead of as
-- staff of the merchant who actually invited them. Confirmed live: signed
-- in as a real invited-staff test user and it appeared as its own
-- (blank-business-name) row in `merchants`.
--
-- Fix: the invite route now passes user_metadata marking the signup as a
-- staff invite (see app/api/settings/team/route.ts); the trigger skips
-- merchant creation when that flag is set.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.raw_user_meta_data->>'is_staff_invite', 'false') = 'true' then
    return new;
  end if;

  insert into public.merchants (id, business_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'business_name', ''));
  return new;
end;
$$;
