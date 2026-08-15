-- Atomic, row-locked stamp/points/steps scan handling.
--
-- Previously /api/scan (app/api/scan/route.ts) did a plain read-then-write:
-- SELECT customer_progress, compute the next progress value in JS, then
-- UPDATE ... WHERE id = row.id. Two near-simultaneous scans of the same
-- pass_id (two staff at a busy location, or a double-tap) could both read
-- the same starting progress and both write "+1", losing one of the two
-- stamps/points — a lost-update race with no locking or optimistic-concurrency
-- guard anywhere in that path.
--
-- Separately, the "redeem" action never verified server-side that the
-- customer had actually reached the reward threshold before resetting their
-- progress (stamps to 0, points reduced, or a steps stage marked complete) —
-- a staff member (or a replayed/forged request) could redeem a reward that
-- was never earned.
--
-- This migration moves the entire read -> compute -> write -> log sequence
-- into a single SECURITY DEFINER RPC that:
--   1. Takes a row lock on the customer_progress row (`for update`), so a
--      concurrent call for the same pass_id blocks until the first commits —
--      the second call then recomputes from the *post-update* row, so no
--      stamp/point is ever lost or double-counted.
--   2. Re-verifies ownership (merchant_id) and that the program is active
--      from inside the same transaction, rather than trusting the caller's
--      earlier, separate read.
--   3. For "redeem", checks the reward was actually earned before resetting
--      anything, raising a distinct 'reward_not_earned' error otherwise.
--   4. Writes customer_progress, scan_events, and (for redeem) redemptions
--      in the same transaction as the lock, so the whole thing is atomic.
--
-- This follows the same SECURITY DEFINER RPC pattern already established by
-- enroll_customer() in 014_customer_dedup.sql, for the same reason: staff
-- sessions act as a different auth.uid() than the merchant they work for, so
-- the function does its own explicit authorization rather than relying on
-- RLS (which is keyed off auth.uid()).
--
-- IMPORTANT: the award/redeem arithmetic here is intentionally a 1:1 mirror
-- of lib/scan/progress.ts (applyAward/applyRedeem). If that file's logic
-- ever changes, this function must be updated to match, and vice versa —
-- see lib/scan/progress.ts's top-of-file comment, which points back here.

create or replace function public.record_scan_event(
  p_pass_id uuid,
  p_merchant_id uuid,
  p_scanned_by uuid,
  p_action text,
  p_amount numeric default null
)
returns table (
  progress jsonb,
  resulted_in_reward boolean,
  reward_description text,
  delta jsonb
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.customer_progress%rowtype;
  v_program public.loyalty_programs%rowtype;
  v_progress jsonb;
  v_next jsonb;
  v_delta jsonb;
  v_reward boolean := false;
  v_reward_desc text := '';
  v_stamps_required int;
  v_stamps_collected int;
  v_points_per_reward numeric;
  v_points numeric;
  v_add numeric;
  v_current_value numeric;
  v_completed jsonb;
  v_stage jsonb;
  v_next_stage jsonb;
  v_newly_unlocked text;
begin
  if p_action not in ('award', 'redeem') then
    raise exception 'invalid_action' using errcode = 'P0001';
  end if;

  -- Row lock: a concurrent call for the same pass_id waits here until the
  -- first transaction commits or rolls back, then reads the up-to-date row.
  select * into v_row
  from public.customer_progress
  where pass_id = p_pass_id
  for update;

  if not found then
    raise exception 'not_found' using errcode = 'P0001';
  end if;

  select * into v_program
  from public.loyalty_programs
  where id = v_row.program_id;

  if v_program.merchant_id <> p_merchant_id then
    raise exception 'forbidden' using errcode = 'P0001';
  end if;
  if not v_program.is_active then
    raise exception 'inactive' using errcode = 'P0001';
  end if;

  v_progress := v_row.progress;

  if p_action = 'award' then
    if v_program.type = 'stamp' then
      v_stamps_required := (v_program.config->>'stamps_required')::int;
      v_stamps_collected := least(coalesce((v_progress->>'stamps_collected')::int, 0) + 1, v_stamps_required);
      v_next := jsonb_build_object('stamps_collected', v_stamps_collected);
      v_reward := v_stamps_collected >= v_stamps_required;
      v_reward_desc := coalesce(v_program.config->>'reward_description', '');
      v_delta := jsonb_build_object('stamps_added', 1);

    elsif v_program.type = 'points' then
      v_points_per_reward := (v_program.config->>'points_per_reward')::numeric;
      v_add := coalesce(p_amount, 1);
      v_points := coalesce((v_progress->>'points')::numeric, 0) + v_add;
      v_next := jsonb_build_object('points', v_points);
      v_reward := v_points >= v_points_per_reward;
      v_reward_desc := coalesce(v_program.config->>'reward_description', '');
      v_delta := jsonb_build_object('points_added', v_add);

    else -- steps
      v_add := coalesce(p_amount, 1);
      v_current_value := coalesce((v_progress->>'current_value')::numeric, 0) + v_add;
      v_completed := coalesce(v_progress->'completed_stage_keys', '[]'::jsonb);
      v_newly_unlocked := null;
      v_reward_desc := '';

      for v_stage in
        select value from jsonb_array_elements(v_program.config->'stages')
        order by (value->>'threshold')::numeric asc
      loop
        if not (v_completed ? (v_stage->>'key')) and v_current_value >= (v_stage->>'threshold')::numeric then
          v_newly_unlocked := v_stage->>'key';
          v_reward_desc := v_stage->>'label';
          exit;
        end if;
      end loop;

      -- Matches lib/scan/progress.ts applyAward: current_value advances on
      -- every award, but completed_stage_keys is only appended to on redeem.
      v_next := jsonb_build_object(
        'current_value', v_current_value,
        'completed_stage_keys', v_completed
      );
      v_reward := v_newly_unlocked is not null;
      v_delta := jsonb_build_object('steps_added', v_add);
      if not v_reward then
        -- Mirrors the JS fallback description when nothing new unlocked.
        select value->>'label' into v_reward_desc
        from jsonb_array_elements(v_program.config->'stages')
        order by (value->>'threshold')::numeric desc
        limit 1;
      end if;
    end if;

  else -- redeem: verify the reward was actually earned before resetting anything
    if v_program.type = 'stamp' then
      v_stamps_required := (v_program.config->>'stamps_required')::int;
      v_stamps_collected := coalesce((v_progress->>'stamps_collected')::int, 0);
      if v_stamps_collected < v_stamps_required then
        raise exception 'reward_not_earned' using errcode = 'P0001';
      end if;
      v_next := jsonb_build_object('stamps_collected', 0);
      v_reward_desc := coalesce(v_program.config->>'reward_description', '');
      v_delta := jsonb_build_object('stamps_reset', 1);

    elsif v_program.type = 'points' then
      v_points_per_reward := (v_program.config->>'points_per_reward')::numeric;
      v_points := coalesce((v_progress->>'points')::numeric, 0);
      if v_points < v_points_per_reward then
        raise exception 'reward_not_earned' using errcode = 'P0001';
      end if;
      v_next := jsonb_build_object('points', v_points - v_points_per_reward);
      v_reward_desc := coalesce(v_program.config->>'reward_description', '');
      v_delta := jsonb_build_object('points_spent', v_points_per_reward);

    else -- steps
      v_current_value := coalesce((v_progress->>'current_value')::numeric, 0);
      v_completed := coalesce(v_progress->'completed_stage_keys', '[]'::jsonb);
      v_next_stage := null;

      for v_stage in
        select value from jsonb_array_elements(v_program.config->'stages')
        order by (value->>'threshold')::numeric asc
      loop
        if not (v_completed ? (v_stage->>'key')) then
          v_next_stage := v_stage;
          exit;
        end if;
      end loop;

      if v_next_stage is null then
        -- Every stage already completed — matches the JS "Complete" fallback,
        -- nothing to redeem, not an error.
        v_next := v_progress;
        v_reward_desc := 'Complete';
        v_delta := '{}'::jsonb;
      else
        if v_current_value < (v_next_stage->>'threshold')::numeric then
          raise exception 'reward_not_earned' using errcode = 'P0001';
        end if;
        v_next := jsonb_build_object(
          'current_value', v_current_value,
          'completed_stage_keys', v_completed || to_jsonb(v_next_stage->>'key')
        );
        v_reward_desc := v_next_stage->>'label';
        v_delta := jsonb_build_object('stage_completed', 1);
      end if;
    end if;
  end if;

  update public.customer_progress
  set progress = v_next
  where id = v_row.id;

  insert into public.scan_events (customer_progress_id, scanned_by, delta, resulted_in_reward)
  values (v_row.id, p_scanned_by, v_delta, v_reward);

  if p_action = 'redeem' then
    insert into public.redemptions (customer_progress_id, reward_description)
    values (v_row.id, v_reward_desc);
  end if;

  return query select v_next, v_reward, v_reward_desc, v_delta;
end;
$$;
