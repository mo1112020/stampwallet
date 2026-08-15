import type {
  PointsConfig,
  PointsProgress,
  ProgramConfig,
  ProgramType,
  Progress,
  StampConfig,
  StampProgress,
  StepsConfig,
  StepsProgress,
} from "@/types";

/**
 * Reference implementation of the award/redeem math.
 *
 * Production writes no longer call this directly — /api/scan (app/api/scan/route.ts)
 * calls the public.record_scan_event() RPC (supabase/migrations/019_atomic_scan_events.sql)
 * instead, so the read-check-write for a single scan happens atomically under
 * a Postgres row lock rather than as a JS read-then-write (which had a
 * lost-update race under concurrent scans of the same pass).
 *
 * This file is kept as the canonical, unit-tested spec for that logic — the
 * SQL function is a hand-written mirror of it. If you change the rules here
 * (or there), update both, and update the parity tests in
 * lib/scan/progress.test.ts.
 */

export type AwardResult = {
  progress: Progress;
  resultedInReward: boolean;
  delta: Record<string, number>;
  rewardDescription: string;
};

export function applyAward(
  type: ProgramType,
  config: ProgramConfig,
  progress: Progress,
  amount?: number
): AwardResult {
  if (type === "stamp") {
    const c = config as StampConfig;
    const p = progress as StampProgress;
    const next = Math.min(p.stamps_collected + 1, c.stamps_required);
    return {
      progress: { stamps_collected: next },
      resultedInReward: next >= c.stamps_required,
      delta: { stamps_added: 1 },
      rewardDescription: c.reward_description,
    };
  }

  if (type === "points") {
    const c = config as PointsConfig;
    const p = progress as PointsProgress;
    const add = amount ?? 1;
    const next = p.points + add;
    return {
      progress: { points: next },
      resultedInReward: next >= c.points_per_reward,
      delta: { points_added: add },
      rewardDescription: c.reward_description,
    };
  }

  const c = config as StepsConfig;
  const p = progress as StepsProgress;
  const add = amount ?? 1;
  const current_value = p.current_value + add;
  const stages = [...c.stages].sort((a, b) => a.threshold - b.threshold);
  const completed = new Set(p.completed_stage_keys);
  let newlyUnlocked: string | null = null;
  for (const stage of stages) {
    if (!completed.has(stage.key) && current_value >= stage.threshold) {
      newlyUnlocked = stage.key;
      break;
    }
  }
  return {
    progress: {
      current_value,
      completed_stage_keys: p.completed_stage_keys,
    },
    resultedInReward: newlyUnlocked !== null,
    delta: { steps_added: add },
    rewardDescription:
      stages.find((s) => s.key === newlyUnlocked)?.label ??
      stages[stages.length - 1]?.label ??
      "Reward",
  };
}

/** Thrown by applyRedeem when progress hasn't actually reached the reward threshold. */
export class RewardNotEarnedError extends Error {
  constructor() {
    super("reward_not_earned");
    this.name = "RewardNotEarnedError";
  }
}

export function applyRedeem(
  type: ProgramType,
  config: ProgramConfig,
  progress: Progress
): { progress: Progress; rewardDescription: string; delta: Record<string, number> } {
  if (type === "stamp") {
    const c = config as StampConfig;
    const p = progress as StampProgress;
    if (p.stamps_collected < c.stamps_required) {
      throw new RewardNotEarnedError();
    }
    return {
      progress: { stamps_collected: 0 },
      rewardDescription: c.reward_description,
      delta: { stamps_reset: 1 },
    };
  }

  if (type === "points") {
    const c = config as PointsConfig;
    const p = progress as PointsProgress;
    if (p.points < c.points_per_reward) {
      throw new RewardNotEarnedError();
    }
    const next = p.points - c.points_per_reward;
    return {
      progress: { points: next },
      rewardDescription: c.reward_description,
      delta: { points_spent: c.points_per_reward },
    };
  }

  const c = config as StepsConfig;
  const p = progress as StepsProgress;
  const stages = [...c.stages].sort((a, b) => a.threshold - b.threshold);
  const nextStage = stages.find((s) => !p.completed_stage_keys.includes(s.key));
  if (!nextStage) {
    return {
      progress: p,
      rewardDescription: "Complete",
      delta: {},
    };
  }
  if (p.current_value < nextStage.threshold) {
    throw new RewardNotEarnedError();
  }
  return {
    progress: {
      current_value: p.current_value,
      completed_stage_keys: [...p.completed_stage_keys, nextStage.key],
    },
    rewardDescription: nextStage.label,
    delta: { stage_completed: 1 },
  };
}
