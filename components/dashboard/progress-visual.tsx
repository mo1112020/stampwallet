import type {
  Progress,
  ProgramConfig,
  ProgramType,
  StampConfig,
  StampProgress,
  PointsConfig,
  PointsProgress,
  StepsConfig,
  StepsProgress,
} from "@/types";
import { cn } from "@/lib/utils";

/**
 * Compact row-scale progress indicator for lists (customer rows, etc.) — a
 * smaller sibling of the card-scale StampGrid/PointsBar/StepsPath rendered
 * inside components/wallet-preview/wallet-preview.tsx. Per docs/06-design-system.md
 * ("visual, not numeric"), every place progress is shown should be a visual,
 * not a raw number or JSON dump.
 */
export function ProgressVisual({
  type,
  config,
  progress,
  className,
}: {
  type: ProgramType;
  config: ProgramConfig;
  progress: Progress;
  className?: string;
}) {
  if (type === "stamp") {
    const { stamps_required, icon } = config as StampConfig;
    const { stamps_collected } = progress as StampProgress;
    const required = Math.max(stamps_required, 1);
    const collected = Math.min(stamps_collected, required);
    return (
      <div className={cn("flex items-center gap-1", className)} title={`${collected}/${required}`}>
        {Array.from({ length: required }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "flex h-5 w-5 items-center justify-center rounded-full text-[11px]",
              i < collected
                ? "bg-[var(--primary)] text-[var(--primary-foreground)]"
                : "bg-[var(--surface-3)] text-transparent"
            )}
          >
            {icon || "●"}
          </span>
        ))}
      </div>
    );
  }

  if (type === "points") {
    const { points_per_reward, points_label } = config as PointsConfig;
    const { points } = progress as PointsProgress;
    const target = Math.max(points_per_reward, 1);
    const pct = Math.min(100, Math.round((points / target) * 100));
    return (
      <div className={cn("flex w-32 flex-col gap-1", className)}>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-[width]"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[11px] text-[var(--muted)]">
          {points} / {target} {points_label}
        </span>
      </div>
    );
  }

  const { stages } = config as StepsConfig;
  const { completed_stage_keys } = progress as StepsProgress;
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {stages.map((stage) => {
        const done = completed_stage_keys.includes(stage.key);
        return (
          <span
            key={stage.key}
            title={stage.label}
            className={cn(
              "h-2 w-6 rounded-full",
              done ? "bg-[var(--primary)]" : "bg-[var(--surface-3)]"
            )}
          />
        );
      })}
    </div>
  );
}
