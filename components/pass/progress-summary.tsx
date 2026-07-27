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

type Props = {
  type: ProgramType;
  config: ProgramConfig;
  progress: Progress;
  color: string;
  t: (key: string, values?: Record<string, string | number>) => string;
};

/**
 * A bigger, plainer restatement of progress than the wallet-card mimic
 * (components/wallet-preview/wallet-preview.tsx) can show at its compact
 * size — one percentage, one bar, one sentence of what's left.
 */
export function ProgressSummary({ type, config, progress, color, t }: Props) {
  let current = 0;
  let target = 0;
  let stageLabel: string | null = null;

  if (type === "stamp") {
    const c = config as StampConfig;
    const p = progress as StampProgress;
    current = p.stamps_collected;
    target = c.stamps_required;
  } else if (type === "points") {
    const c = config as PointsConfig;
    const p = progress as PointsProgress;
    current = p.points;
    target = c.points_per_reward;
  } else {
    const c = config as StepsConfig;
    const p = progress as StepsProgress;
    const sorted = [...c.stages].sort((a, b) => a.threshold - b.threshold);
    target = sorted.length;
    current = p.completed_stage_keys.length;
    const next = sorted.find((s) => !p.completed_stage_keys.includes(s.key));
    stageLabel = next?.label ?? sorted[sorted.length - 1]?.label ?? null;
  }

  const rewardAvailable = target > 0 && current >= target;
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
  const remaining = Math.max(target - current, 0);

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 shadow-sm sm:p-6">
      {rewardAvailable ? (
        <div className="flex items-center gap-2.5 rounded-xl bg-[var(--success-soft)] px-4 py-3.5 text-[15px] font-semibold text-[var(--success)]">
          <span aria-hidden="true">🎉</span>
          {t("rewardReady")}
        </div>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <p className="text-[13px] font-medium uppercase tracking-wide text-[var(--muted)]">
              {t("yourProgress")}
            </p>
            <p className="text-[13px] font-semibold text-[var(--ink)]">{pct}%</p>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full transition-[width] duration-700 ease-[var(--ease-out)]"
              style={{ width: `${pct}%`, backgroundColor: color }}
            />
          </div>
          <p className="mt-3 text-[14px] text-[var(--muted)]">
            {type === "steps" && stageLabel ? t("nextStage", { stage: stageLabel }) : t("toGo", { count: remaining })}
          </p>
        </>
      )}
    </div>
  );
}
