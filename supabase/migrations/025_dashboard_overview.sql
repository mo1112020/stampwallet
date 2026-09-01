-- P2: one-call dashboard-home data loader.
--
-- app/[locale]/dashboard/page.tsx used to make ~8 separate Supabase round
-- trips per render: loyalty_programs, notification_campaigns,
-- customer_progress, scan_events x3 (current range, previous range, recent
-- activity) and redemptions x2 (current, previous). Each is its own PostgREST
-- request = its own transaction + role/search_path/JWT set_config. Under load
-- that per-request overhead against the connection pool — not the query work
-- itself — was the dominant cost (see docs/load-testing-report.md sec 9.4).
--
-- This function returns everything that page needs in ONE call:
--   { programs, campaigns, overview, previous_overview, activity }
-- computed with DB-side aggregation instead of shipping every scan_events /
-- customer_progress row to the Node function to reduce in JS.
--
-- ── SECURITY ─────────────────────────────────────────────────────────────
-- SECURITY DEFINER, but this is NOT a privilege escalation. The gate below is
-- the exact predicate every RLS policy on the tables it reads already uses
-- (merchants / loyalty_programs / customer_progress / scan_events /
-- redemptions / notification_campaigns — migrations 005 and 011):
--
--     p_merchant_id = auth.uid()  OR  public.is_active_staff_of(p_merchant_id)
--
-- If that passes, RLS would already grant the caller every row belonging to
-- p_merchant_id. Every query below is scoped to p_merchant_id's programs, so
-- the function returns exactly the row set RLS would return for this caller,
-- and nothing else — no cross-tenant data is reachable.
--
-- This mirrors the established pattern of enroll_customer() (014) and
-- record_scan_event() (019): they are SECURITY DEFINER because a staff
-- session's auth.uid() is the staff member, not the merchant, so the function
-- authorizes explicitly rather than leaning on auth.uid()-keyed RLS.
--
-- ── PARITY ───────────────────────────────────────────────────────────────
-- The aggregation here is a 1:1 mirror of the previous
-- lib/analytics/queries.ts (getAnalyticsOverview) as of migration time. The
-- per-scan "delta key -> activity type/label" mapping is intentionally left
-- to the caller (lib/analytics/dashboard.ts) so that bit of logic stays in
-- one place. If getAnalyticsOverview's math changes, update this too.

create or replace function public.dashboard_overview(
  p_merchant_id    uuid,
  p_from           timestamptz,
  p_to             timestamptz,
  p_prev_from      timestamptz,
  p_prev_to        timestamptz,
  p_activity_limit int default 6
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_currency  text;
  v_programs  jsonb;
  v_campaigns jsonb;
  v_activity  jsonb;
  v_overview  jsonb;
  v_prev      jsonb;
begin
  -- `auth.uid()` is NULL for an unauthenticated caller; `p_merchant_id = NULL`
  -- is NULL, and `IF NULL THEN` would skip the raise (fail open). Guard it
  -- explicitly so the gate is strictly deny-by-default.
  if auth.uid() is null
     or not (p_merchant_id = auth.uid() or public.is_active_staff_of(p_merchant_id)) then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;

  select currency into v_currency from public.merchants where id = p_merchant_id;

  -- Full program rows, newest first (page renders cards + reads config/is_active).
  select coalesce(jsonb_agg(to_jsonb(p) order by p.created_at desc), '[]'::jsonb)
    into v_programs
  from public.loyalty_programs p
  where p.merchant_id = p_merchant_id;

  -- Up to 4 most-recent non-draft campaigns.
  select coalesce(jsonb_agg(
           jsonb_build_object('id', c.id, 'title', c.title,
                              'status', c.status, 'updated_at', c.updated_at)
           order by c.updated_at desc), '[]'::jsonb)
    into v_campaigns
  from (
    select id, title, status, updated_at
    from public.notification_campaigns
    where merchant_id = p_merchant_id and status <> 'draft'
    order by updated_at desc
    limit 4
  ) c;

  -- Current + previous overview in one pass over scan_events / redemptions.
  with
  cp as (
    select c.id, c.customer_id, c.program_id
    from public.customer_progress c
    join public.loyalty_programs p on p.id = c.program_id
    where p.merchant_id = p_merchant_id
  ),
  reward_val as (
    select p.id as program_id,
           nullif(p.config->>'reward_value', '')::numeric as reward_value
    from public.loyalty_programs p
    where p.merchant_id = p_merchant_id
  ),
  scan_by_cp as (
    select
      cp.id          as cp_id,
      cp.customer_id as customer_id,
      count(*) filter (where se.created_at >= p_from      and se.created_at <= p_to)      as cur_n,
      count(*) filter (where se.created_at >= p_prev_from and se.created_at <= p_prev_to) as prev_n,
      coalesce(sum((se.delta->>'points_added')::numeric)
               filter (where se.created_at >= p_from and se.created_at <= p_to), 0)      as cur_pts_add,
      coalesce(sum((se.delta->>'points_spent')::numeric)
               filter (where se.created_at >= p_from and se.created_at <= p_to), 0)      as cur_pts_spent,
      coalesce(sum((se.delta->>'points_added')::numeric)
               filter (where se.created_at >= p_prev_from and se.created_at <= p_prev_to), 0) as prev_pts_add,
      coalesce(sum((se.delta->>'points_spent')::numeric)
               filter (where se.created_at >= p_prev_from and se.created_at <= p_prev_to), 0) as prev_pts_spent
    from public.scan_events se
    join cp on cp.id = se.customer_progress_id
    where se.created_at >= least(p_from, p_prev_from)
      and se.created_at <= greatest(p_to, p_prev_to)
    group by cp.id, cp.customer_id
  ),
  redem as (
    select cp.program_id,
           (r.redeemed_at >= p_from      and r.redeemed_at <= p_to)      as in_cur,
           (r.redeemed_at >= p_prev_from and r.redeemed_at <= p_prev_to) as in_prev
    from public.redemptions r
    join cp on cp.id = r.customer_progress_id
    where r.redeemed_at >= least(p_from, p_prev_from)
      and r.redeemed_at <= greatest(p_to, p_prev_to)
  ),
  base as (
    select (select count(*) from cp)                    as total_cards,
           (select count(distinct customer_id) from cp) as total_customers
  ),
  cur_agg as (
    select
      coalesce(sum(cur_n), 0)                            as total_scans,
      count(*) filter (where cur_n > 0)                  as active_cards,
      count(distinct customer_id) filter (where cur_n > 0) as active_customers,
      count(*) filter (where cur_n >= 2)                 as repeat_count,
      count(*) filter (where cur_n > 0)                  as with_scan,
      coalesce(sum(cur_pts_add), 0)                      as points_earned,
      coalesce(sum(cur_pts_spent), 0)                    as points_redeemed
    from scan_by_cp
  ),
  prev_agg as (
    select
      coalesce(sum(prev_n), 0)                           as total_scans,
      count(*) filter (where prev_n > 0)                 as active_cards,
      count(distinct customer_id) filter (where prev_n > 0) as active_customers,
      count(*) filter (where prev_n >= 2)               as repeat_count,
      count(*) filter (where prev_n > 0)                 as with_scan,
      coalesce(sum(prev_pts_add), 0)                     as points_earned,
      coalesce(sum(prev_pts_spent), 0)                   as points_redeemed
    from scan_by_cp
  ),
  cur_rev as (
    select count(*) filter (where in_cur)                                       as rewards_redeemed,
           coalesce(sum(coalesce(rv.reward_value, 0)) filter (where in_cur), 0) as revenue_impact
    from redem left join reward_val rv on rv.program_id = redem.program_id
  ),
  prev_rev as (
    select count(*) filter (where in_prev)                                       as rewards_redeemed,
           coalesce(sum(coalesce(rv.reward_value, 0)) filter (where in_prev), 0) as revenue_impact
    from redem left join reward_val rv on rv.program_id = redem.program_id
  )
  select
    jsonb_build_object(
      'totalCustomers',  b.total_customers,
      'activeCustomers', c.active_customers,
      'totalCards',      b.total_cards,
      'activeCards',     c.active_cards,
      'rewardsRedeemed', cr.rewards_redeemed,
      'totalScans',      c.total_scans,
      'pointsEarned',    c.points_earned,
      'pointsRedeemed',  c.points_redeemed,
      'retentionRate',   case when c.with_scan > 0
                              then round((c.repeat_count::numeric / c.with_scan) * 100, 1)
                              else 0 end,
      'repeatVisits',    greatest(c.total_scans - c.active_cards, 0),
      'revenueImpact',   case when v_currency is not null then cr.revenue_impact else null end,
      'currency',        v_currency
    ),
    jsonb_build_object(
      'totalCustomers',  b.total_customers,
      'activeCustomers', pv.active_customers,
      'totalCards',      b.total_cards,
      'activeCards',     pv.active_cards,
      'rewardsRedeemed', pr.rewards_redeemed,
      'totalScans',      pv.total_scans,
      'pointsEarned',    pv.points_earned,
      'pointsRedeemed',  pv.points_redeemed,
      'retentionRate',   case when pv.with_scan > 0
                              then round((pv.repeat_count::numeric / pv.with_scan) * 100, 1)
                              else 0 end,
      'repeatVisits',    greatest(pv.total_scans - pv.active_cards, 0),
      'revenueImpact',   case when v_currency is not null then pr.revenue_impact else null end,
      'currency',        v_currency
    )
  into v_overview, v_prev
  from base b, cur_agg c, prev_agg pv, cur_rev cr, prev_rev pr;

  -- Recent activity: raw rows; the caller maps delta -> type/label exactly as
  -- getRecentActivity did (kept in one place, lib/analytics/dashboard.ts).
  select coalesce(jsonb_agg(sub.a order by sub.created_at desc), '[]'::jsonb)
    into v_activity
  from (
    select jsonb_build_object(
             'id',            se.id,
             'delta',         se.delta,
             'created_at',    se.created_at,
             'customer_name', cust.name,
             'program_name',  lp.name
           ) as a,
           se.created_at
    from public.scan_events se
    join public.customer_progress c  on c.id  = se.customer_progress_id
    join public.loyalty_programs  lp on lp.id = c.program_id
    left join public.customers   cust on cust.id = c.customer_id
    where lp.merchant_id = p_merchant_id
    order by se.created_at desc
    limit p_activity_limit
  ) sub;

  return jsonb_build_object(
    'programs',          v_programs,
    'campaigns',         v_campaigns,
    'overview',          v_overview,
    'previous_overview', v_prev,
    'activity',          v_activity
  );
end;
$$;

-- Postgres grants EXECUTE to PUBLIC on a new function by default; drop that so
-- only a logged-in role can reach it (defense in depth alongside the auth.uid()
-- gate above).
revoke execute on function public.dashboard_overview(uuid, timestamptz, timestamptz, timestamptz, timestamptz, int) from public;
grant  execute on function public.dashboard_overview(uuid, timestamptz, timestamptz, timestamptz, timestamptz, int) to authenticated;
