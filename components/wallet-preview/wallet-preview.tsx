"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
  const [showDetails, setShowDetails] = useState(false);
  const p =
    progress ??
    (type === "stamp"
      ? ({ stamps_collected: 3 } as StampProgress)
      : type === "points"
        ? ({ points: 420 } as PointsProgress)
        : ({ current_value: 7, completed_stage_keys: ["welcome"] } as StepsProgress));

  const fields = renderPassFields(type, config, p, businessName);
  const details = (config as { details?: { description?: string; terms?: string; website?: string } }).details;
  const backgroundImage = (config as { background_image_url?: string }).background_image_url;

  return (
    <div
      className="mx-auto w-full max-w-sm overflow-hidden rounded-2xl shadow-lg"
      style={{
        backgroundColor: primaryColor,
        backgroundImage: backgroundImage ? `linear-gradient(rgba(0, 0, 0, 0.28), rgba(0, 0, 0, 0.28)), url("${backgroundImage}")` : undefined,
        backgroundPosition: "center",
        backgroundSize: "cover",
        color: secondaryColor,
      }}
    >
      {showDetails ? (
        <div className="min-h-[290px] px-5 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] opacity-80">{businessName || "Your business"}</p>
              <h2 className="mt-2 text-xl font-semibold">Card details</h2>
            </div>
            <button type="button" onClick={() => setShowDetails(false)} className="rounded-full bg-white/15 p-2 hover:bg-white/25" aria-label="Back to pass">
              <ArrowLeft className="h-4 w-4" />
            </button>
          </div>
          <div className="mt-5 space-y-4 text-sm leading-6">
            <div><p className="text-xs font-medium uppercase tracking-wide opacity-65">Your reward</p><p className="mt-1 font-medium">{fields.secondaryValue}</p></div>
            {details?.description && <div><p className="text-xs font-medium uppercase tracking-wide opacity-65">About this program</p><p className="mt-1 whitespace-pre-line">{details.description}</p></div>}
            {details?.terms && <div><p className="text-xs font-medium uppercase tracking-wide opacity-65">Terms</p><p className="mt-1 whitespace-pre-line">{details.terms}</p></div>}
            {details?.website && <a href={details.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 font-semibold underline underline-offset-4"><ExternalLink className="h-3.5 w-3.5" />Visit website</a>}
            {!details?.description && !details?.terms && !details?.website && <p className="opacity-75">Keep collecting to unlock your reward. Contact {businessName || "the business"} for program details.</p>}
          </div>
        </div>
      ) : <>
        <div className="px-5 pt-5 pb-3">
          <p className="text-xs uppercase tracking-[0.2em] opacity-80">{businessName || "Your business"}</p>
          <p className="mt-3 text-sm opacity-80">{fields.primaryLabel}</p>
          <p className="text-3xl font-semibold tracking-tight">{fields.primaryValue}</p>
          <p className="mt-4 text-sm opacity-80">{fields.secondaryLabel}</p>
          <p className="text-lg font-medium">{fields.secondaryValue}</p>
        </div>

        <div className="bg-white/15 px-5 py-4">
          {type === "stamp" && <StampGrid required={(config as StampConfig).stamps_required} collected={(p as StampProgress).stamps_collected} icon={(config as StampConfig).icon} fill={secondaryColor} />}
          {type === "points" && <PointsBar current={(p as PointsProgress).points} target={(config as PointsConfig).points_per_reward} label={(config as PointsConfig).points_label} fill={secondaryColor} />}
          {type === "steps" && <StepsPath stages={(config as StepsConfig).stages} progress={p as StepsProgress} fill={secondaryColor} />}
        </div>

        {fields.rewardAvailable && <div className="bg-white/20 px-5 py-3 text-center text-sm font-semibold">Reward ready</div>}
        <button type="button" onClick={() => setShowDetails(true)} className="w-full border-t border-white/15 px-5 py-3 text-sm font-semibold text-white/90 hover:bg-white/10">
          More details
        </button>
      </>}
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
  label,
  fill,
}: {
  current: number;
  target: number;
  label: string;
  fill: string;
}) {
  const pct = Math.min(100, Math.round((current / target) * 100));
  return (
    <div className="rounded-xl bg-white px-5 py-4 text-center text-[#1f57e7]">
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-4xl font-medium leading-none">{current}</span>
        <span className="text-sm font-semibold">{label}</span>
      </div>
      <div className="mt-4 flex items-center justify-center gap-2">
        {Array.from({ length: 5 }).map((_, index) => (
          <span key={index} className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: index < Math.ceil(pct / 20) ? fill : "#d1d5db" }} />
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-500">{current} of {target} {label}</p>
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
