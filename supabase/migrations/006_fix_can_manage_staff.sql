-- can_manage_staff (migration 005) could return NULL instead of false when
-- auth.uid() is null (e.g. p_merchant_id = auth.uid() is NULL, not FALSE,
-- under SQL three-valued logic, and `NULL OR FALSE` is NULL). Harmless for
-- its RLS use (Postgres treats a NULL USING/WITH CHECK result as deny, same
-- as FALSE) but sloppy for a function named/typed as returning boolean —
-- verified live against the linked Supabase project during Phase 3 work.
-- Discovered via direct RPC testing, not just static review.

create or replace function public.can_manage_staff(p_merchant_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    p_merchant_id = auth.uid()
    or exists (
      select 1 from public.staff_accounts
      where user_id = auth.uid()
        and merchant_id = p_merchant_id
        and status = 'active'
        and role = 'admin'
    ),
    false
  );
$$;
