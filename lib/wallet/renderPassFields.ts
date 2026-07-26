import type {
  CardAppearance,
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
import { computeExpirationStatus, formatDaysRemaining } from "@/lib/wallet/expiration";

export type PassFields = {
  primaryLabel: string;
  primaryValue: string;
  secondaryLabel: string;
  secondaryValue: string;
  auxiliaryLabel: string;
  auxiliaryValue: string;
  rewardAvailable: boolean;
  /** Only present when config.expiration is enabled and enrolledAt was supplied. */
  expiry?: { label: string; value: string; expiresAt: Date; expired: boolean };
};

export function initialProgress(type: ProgramType, config?: ProgramConfig): Progress {
  switch (type) {
    case "stamp": {
      const c = config as StampConfig | undefined;
      const stampsRequired = c?.stamps_required ?? 25;
      const initialStamps = Math.min(Math.max(c?.initial_stamps ?? 0, 0), stampsRequired);
      return { stamps_collected: initialStamps };
    }
    case "points":
      return { points: 0 };
    case "steps":
      return { current_value: 0, completed_stage_keys: [] };
  }
}

export function renderPassFields(
  type: ProgramType,
  config: ProgramConfig,
  progress: Progress,
  businessName: string,
  /** customer_progress.created_at — omit to leave `expiry` off the result
   * (e.g. dashboard previews with no real customer pass yet). */
  enrolledAt?: string | Date
): PassFields {
  const expirationStatus = enrolledAt
    ? computeExpirationStatus((config as CardAppearance).expiration, enrolledAt)
    : null;
  const expiry = expirationStatus
    ? {
        label: "Expires",
        value: formatDaysRemaining(expirationStatus),
        expiresAt: expirationStatus.expiresAt,
        expired: expirationStatus.expired,
      }
    : undefined;

  if (type === "stamp") {
    const c = config as StampConfig;
    const p = progress as StampProgress;
    const rewardAvailable = p.stamps_collected >= c.stamps_required;
    return {
      primaryLabel: "Stamps",
      primaryValue: `${p.stamps_collected} / ${c.stamps_required}`,
      secondaryLabel: "Reward",
      secondaryValue: c.reward_description,
      auxiliaryLabel: "Business",
      auxiliaryValue: businessName,
      rewardAvailable,
      expiry,
    };
  }

  if (type === "points") {
    const c = config as PointsConfig;
    const p = progress as PointsProgress;
    const rewardAvailable = p.points >= c.points_per_reward;
    return {
      primaryLabel: c.points_label,
      primaryValue: `${p.points} / ${c.points_per_reward}`,
      secondaryLabel: "Reward",
      secondaryValue: c.reward_description,
      auxiliaryLabel: "Business",
      auxiliaryValue: businessName,
      rewardAvailable,
      expiry,
    };
  }

  const c = config as StepsConfig;
  const p = progress as StepsProgress;
  const stages = [...c.stages].sort((a, b) => a.threshold - b.threshold);
  const current =
    stages.find((s) => !p.completed_stage_keys.includes(s.key)) ??
    stages[stages.length - 1];
  const rewardAvailable = p.completed_stage_keys.length < stages.length &&
    p.current_value >= (current?.threshold ?? 0) &&
    current !== undefined &&
    !p.completed_stage_keys.includes(current.key);

  return {
    primaryLabel: "Stage",
    primaryValue: current?.label ?? "Complete",
    secondaryLabel: "Progress",
    secondaryValue: String(p.current_value),
    auxiliaryLabel: "Business",
    auxiliaryValue: businessName,
    rewardAvailable,
    expiry,
  };
}
