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

export function applyRedeem(
  type: ProgramType,
  config: ProgramConfig,
  progress: Progress
): { progress: Progress; rewardDescription: string; delta: Record<string, number> } {
  if (type === "stamp") {
    const c = config as StampConfig;
    return {
      progress: { stamps_collected: 0 },
      rewardDescription: c.reward_description,
      delta: { stamps_reset: 1 },
    };
  }

  if (type === "points") {
    const c = config as PointsConfig;
    const p = progress as PointsProgress;
    const next = Math.max(0, p.points - c.points_per_reward);
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
  return {
    progress: {
      current_value: p.current_value,
      completed_stage_keys: [...p.completed_stage_keys, nextStage.key],
    },
    rewardDescription: nextStage.label,
    delta: { stage_completed: 1 },
  };
}
