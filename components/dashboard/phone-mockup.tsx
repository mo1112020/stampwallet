"use client";

import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { type LucideIcon } from "lucide-react";
import type { PointsConfig, ProgramConfig, ProgramType, StepsConfig } from "@/types";

export type PhoneMockupProps = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  textColor?: string;
  iconName?: string;
  backgroundImage?: string;
  stampsRequired?: number;
  stampsCollected?: number;
  actionHref?: string;
  actionText?: string;
  isTemplate?: boolean;
  isActive?: boolean;
  programType?: ProgramType;
  programConfig?: ProgramConfig;
};

export function getIconComponent(iconName: string): LucideIcon {
  const icon = (LucideIcons as any)[iconName];
  return icon || LucideIcons.Star;
}

const BARCODE_WIDTHS = [2,1,3,1,2,1,1,2,3,1,2,1,1,3,2,1,2,1,3,1,1,2,1,2];

export function PhoneMockup({
  name,
  primaryColor,
  secondaryColor,
  textColor = "text-white",
  iconName = "Star",
  backgroundImage,
  stampsRequired = 10,
  stampsCollected = 0,
  actionHref,
  actionText = "Open",
  isTemplate = false,
  isActive,
  programType = "stamp",
  programConfig,
}: PhoneMockupProps) {
  const Icon = getIconComponent(iconName);
  const pointsConfig = programConfig as PointsConfig | undefined;
  const stepsConfig = programConfig as StepsConfig | undefined;
  const rewardDescription = (programConfig as { reward_description?: string } | undefined)?.reward_description;
  const pointsTarget = pointsConfig?.points_per_reward ?? 1000;
  const demoPoints = Math.min(420, pointsTarget);
  const pointsPercent = Math.min(100, Math.round((demoPoints / pointsTarget) * 100));
  const stages = [...(stepsConfig?.stages ?? [])].sort((a, b) => a.threshold - b.threshold);

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Status badge */}
      {isActive !== undefined && (
        <div className={cn(
          "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
          isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-500"
        )}>
          <div className={cn("h-2 w-2 rounded-full", isActive ? "bg-green-500" : "bg-red-400")} />
          {isActive ? "Active" : "Inactive"}
        </div>
      )}

      {/* Phone frame */}
      <div className="relative h-[480px] w-[235px] shrink-0 overflow-hidden rounded-[42px] border-[10px] border-[#2b2b2b] bg-[#f0f0f0] shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl">
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-20 h-9 w-[3px] rounded-r-sm bg-[#4a4a4a]" />
        <div className="absolute -left-[3px] top-32 h-12 w-[3px] rounded-r-sm bg-[#4a4a4a]" />
        <div className="absolute -left-[3px] top-48 h-12 w-[3px] rounded-r-sm bg-[#4a4a4a]" />
        <div className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-l-sm bg-[#4a4a4a]" />

        {/* Screen bezel */}
        <div className="absolute inset-0 rounded-[34px] bg-white">
          {/* Dynamic Island */}
          <div className="absolute top-3 left-1/2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />

          {/* Status bar */}
          <div className="h-11" />

          {/* Wallet Card */}
          <div className="px-3">
            <div
              className={cn("relative w-full overflow-hidden rounded-2xl shadow-lg", textColor)}
              style={{ backgroundColor: primaryColor }}
            >
              {/* Top image area — fixed height 100px */}
              <div className="relative h-[100px] w-full overflow-hidden">
                {backgroundImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={backgroundImage}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                    {/* dark gradient overlay so text is readable */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/10 to-transparent" />
                  </>
                ) : (
                  /* Colour gradient fallback */
                  <div
                    className="h-full w-full"
                    style={{
                      background: `linear-gradient(135deg, ${secondaryColor}99, ${primaryColor})`,
                    }}
                  />
                )}

                {/* Card name overlaid on the image */}
                <div className="absolute bottom-0 left-0 right-0 px-3 pb-2 pt-6 bg-gradient-to-t from-black/40 to-transparent">
                  <h4 className="text-[11px] font-bold leading-tight text-white drop-shadow-md truncate">
                    {name || "Program Name"}
                  </h4>
                </div>
              </div>

              {/* Reward progress */}
              <div className="px-3 pt-2">
                {programType === "stamp" && <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: Math.min(25, Math.max(1, stampsRequired)) }).map((_, i) => {
                    const filled = i < stampsCollected;
                    return (
                      <div
                        key={i}
                        className="flex aspect-square items-center justify-center rounded-full"
                        style={{
                          backgroundColor: filled ? secondaryColor : "rgba(255,255,255,0.18)",
                          border: `1.5px solid ${filled ? secondaryColor : "rgba(255,255,255,0.45)"}`,
                        }}
                      >
                        <Icon
                          className="h-3 w-3"
                          style={{ color: filled ? "#fff" : "rgba(255,255,255,0.7)" }}
                        />
                      </div>
                    );
                  })}
                </div>}
                {programType === "points" && (
                  <div className="overflow-hidden rounded-lg bg-white/90 py-2.5 text-[#1f57e7]">
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-3xl font-medium leading-none">{demoPoints}</span>
                      <span className="text-xs font-semibold">{pointsConfig?.points_label ?? "pt"}</span>
                    </div>
                    <div className="mt-2.5 flex items-center justify-center gap-1.5">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <span key={index} className="h-2 w-2 rounded-full" style={{ backgroundColor: index < Math.ceil(pointsPercent / 20) ? "#1f57e7" : "#d1d5db" }} />
                      ))}
                    </div>
                    <div className="mx-3 mt-2 h-px bg-gray-200" />
                  </div>
                )}
                {programType === "steps" && (
                  <div className="space-y-1.5 py-1">
                    {stages.slice(0, 4).map((stage, index) => (
                      <div key={stage.key} className="flex items-center gap-2 text-[9px]">
                        <span className="flex h-3 w-3 items-center justify-center rounded-full border" style={{ borderColor: secondaryColor, backgroundColor: index === 0 ? secondaryColor : "transparent" }}>
                          {index === 0 && <span className="h-1 w-1 rounded-full bg-white" />}
                        </span>
                        <span className={index === 0 ? "font-semibold" : "opacity-65"}>{stage.label}</span>
                        <span className="ml-auto opacity-60">{stage.threshold}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info row */}
              <div className="px-3 pt-3 pb-1 flex justify-between text-[9px]">
                <div>
                  <p className="opacity-60 uppercase tracking-wide">{programType === "points" ? "points to reward" : programType === "steps" ? "next stage" : "stamps to reward"}</p>
                  <p className="font-bold text-[11px]">{programType === "points" ? `${pointsTarget - demoPoints} left` : programType === "steps" ? (stages[1]?.label ?? "Complete") : `${Math.max(0, stampsRequired - stampsCollected)} left`}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-60 uppercase tracking-wide">Reward</p>
                  <p className="max-w-[84px] truncate text-[11px] font-bold">{programType === "steps" ? (stages.at(-1)?.label ?? "Reward") : (rewardDescription ?? "Free item")}</p>
                </div>
              </div>

              {/* Barcode */}
              <div className="mx-3 mb-3 mt-2 flex flex-col items-center rounded-xl bg-white px-2 py-1.5">
                <div className="flex h-7 w-full items-end gap-[1.5px]">
                  {BARCODE_WIDTHS.map((w, i) => (
                    <div
                      key={i}
                      className="bg-black"
                      style={{ width: `${w * 3}px`, height: `${80 + (i % 3) * 6}%` }}
                    />
                  ))}
                </div>
                <p className="mt-0.5 text-[8px] text-gray-400">Tap ••• for details</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Label & action */}
      <div className="w-[235px]">
        <h3 className="text-center text-sm font-semibold text-[var(--ink)] truncate">{name || "Untitled"}</h3>
        {actionHref && (
          <Link
            href={actionHref}
            className={cn(
              "mt-2 block w-full rounded-xl px-4 py-2 text-center text-sm font-semibold transition-colors active:scale-95",
              isTemplate
                ? "bg-[#1a1a1a] text-white hover:bg-black"
                : "border border-[var(--line)] bg-white text-[var(--ink)] hover:bg-gray-50"
            )}
          >
            {actionText}
          </Link>
        )}
      </div>
    </div>
  );
}

export function EmptyPhoneMockup({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href={`/${locale}/dashboard/templates`}
        className="relative flex h-[480px] w-[235px] shrink-0 items-center justify-center rounded-[42px] border-[10px] border-dashed border-gray-200 bg-gray-50 shadow-sm transition-all hover:-translate-y-1 hover:border-gray-300 hover:shadow-lg"
      >
        <div className="absolute top-3 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-gray-200" />
        <div className="flex flex-col items-center gap-2 text-gray-300">
          <LucideIcons.Plus className="h-12 w-12" strokeWidth={1.5} />
          <span className="text-sm font-medium">New card</span>
        </div>
      </Link>
      <div className="w-[235px] space-y-2">
        <h3 className="text-center text-sm font-semibold text-[var(--ink)]">Create card</h3>
        <Link
          href={`/${locale}/dashboard/templates`}
          className="block w-full rounded-xl bg-[#1a1a1a] px-4 py-2 text-center text-sm font-semibold text-white hover:bg-black active:scale-95"
        >
          Browse templates
        </Link>
        <Link
          href={`/${locale}/dashboard/programs/new`}
          className="block w-full rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-center text-sm font-semibold text-[var(--muted)] hover:bg-gray-50 active:scale-95"
        >
          From scratch
        </Link>
      </div>
    </div>
  );
}
