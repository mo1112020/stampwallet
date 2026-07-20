"use client";

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
import { renderPassFields } from "@/lib/wallet/renderPassFields";

type Props = {
  type: ProgramType;
  config: ProgramConfig;
  progress?: Progress;
  businessName: string;
  primaryColor?: string;
  secondaryColor?: string;
  icon?: string;
};

export function WalletPreview({
  type,
  config,
  progress,
  businessName,
  primaryColor = "#3E0856",
  secondaryColor = "#FAAE62",
}: Props) {
  const p =
    progress ??
    (type === "stamp"
      ? ({ stamps_collected: 3 } as StampProgress)
      : type === "points"
        ? ({ points: 420 } as PointsProgress)
        : ({ current_value: 7, completed_stage_keys: ["welcome"] } as StepsProgress));

  const fields = renderPassFields(type, config, p, businessName);

  return (
    <div
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl shadow-lg"
      style={{ background: primaryColor, color: secondaryColor }}
    >
      <div className="px-5 pt-5 pb-3">
        <p className="text-xs uppercase tracking-[0.2em] opacity-80">{businessName || "Your business"}</p>
        <p className="mt-3 text-sm opacity-80">{fields.primaryLabel}</p>
        <p className="text-3xl font-semibold tracking-tight">{fields.primaryValue}</p>
        <p className="mt-4 text-sm opacity-80">{fields.secondaryLabel}</p>
        <p className="text-lg font-medium">{fields.secondaryValue}</p>
      </div>

      <div className="bg-white/15 px-5 py-4">
        {type === "stamp" && (
          <StampGrid
            required={(config as StampConfig).stamps_required}
            collected={(p as StampProgress).stamps_collected}
            icon={(config as StampConfig).icon}
            fill={secondaryColor}
          />
        )}
        {type === "points" && (
          <PointsBar
            current={(p as PointsProgress).points}
            target={(config as PointsConfig).points_per_reward}
            fill={secondaryColor}
          />
        )}
        {type === "steps" && (
          <StepsPath
            stages={(config as StepsConfig).stages}
            progress={p as StepsProgress}
            fill={secondaryColor}
          />
        )}
      </div>

      {fields.rewardAvailable && (
        <div className="bg-white/20 px-5 py-3 text-center text-sm font-semibold">
          Reward ready
        </div>
      )}
    </div>
  );
}

function StampGrid({
  required,
  collected,
  icon,
  fill,
}: {
  required: number;
  collected: number;
  icon: string;
  fill: string;
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {Array.from({ length: required }).map((_, i) => (
        <div
          key={i}
          className="flex aspect-square items-center justify-center rounded-full text-lg"
          style={{
            background: i < collected ? fill : "transparent",
            color: i < collected ? "#ffffff" : fill,
            border: `1.5px solid ${fill}`,
            opacity: i < collected ? 1 : 0.45,
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
}

function PointsBar({
  current,
  target,
  fill,
}: {
  current: number;
  target: number;
  fill: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div>
      <div className="h-3 overflow-hidden rounded-full bg-white/25">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: fill }} />
      </div>
      <p className="mt-2 text-xs opacity-80">{pct}% toward reward</p>
    </div>
  );
}

function StepsPath({
  stages,
  progress,
  fill,
}: {
  stages: StepsConfig["stages"];
  progress: StepsProgress;
  fill: string;
}) {
  const sorted = [...stages].sort((a, b) => a.threshold - b.threshold);
  return (
    <ol className="space-y-2">
      {sorted.map((stage) => {
        const done = progress.completed_stage_keys.includes(stage.key);
        const current =
          !done &&
          progress.current_value >= stage.threshold &&
          !sorted.some(
            (s) =>
              s.threshold < stage.threshold &&
              !progress.completed_stage_keys.includes(s.key) &&
              progress.current_value >= s.threshold
          );
        return (
          <li key={stage.key} className="flex items-center gap-3 text-sm">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{
                background: done || current ? fill : "transparent",
                border: `1.5px solid ${fill}`,
                opacity: done || current ? 1 : 0.4,
              }}
            />
            <span style={{ opacity: done || current ? 1 : 0.55 }}>{stage.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
