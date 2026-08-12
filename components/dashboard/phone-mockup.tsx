"use client";

import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { Clock, ExternalLink, type LucideIcon } from "lucide-react";
import type { BarcodeStyle, CardAppearance, PointsConfig, ProgramConfig, ProgramType, StepsConfig } from "@/types";
import { BarcodeImage } from "@/components/dashboard/print/barcode-image";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { getStampCellScale, getStampGridColumns } from "@/lib/stamp-grid";
import { computeExpirationStatus, formatDaysRemaining } from "@/lib/wallet/expiration";

const STAMP_ICON_SIZE: Record<ReturnType<typeof getStampCellScale>, string> = {
  lg: "h-3 w-3",
  md: "h-2.5 w-2.5",
  sm: "h-2 w-2",
  xs: "h-1.5 w-1.5",
};

const STAMP_GAP: Record<ReturnType<typeof getStampCellScale>, string> = {
  lg: "gap-1.5",
  md: "gap-1",
  sm: "gap-1",
  xs: "gap-0.5",
};

const STAMP_BORDER_WIDTH: Record<ReturnType<typeof getStampCellScale>, string> = {
  lg: "1.5px",
  md: "1.5px",
  sm: "1px",
  xs: "1px",
};

export type PhoneMockupProps = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  textColor?: string;
  iconName?: string;
  backgroundImage?: string;
  /** Merchant name/logo shown in the card's own header bar — distinct from
   * `name` (the program name, shown below the card), matching how the real
   * Apple/Google Wallet card header always shows the *merchant's* name and
   * logo (see logoText/organizationName in lib/wallet/apple.ts), not the
   * program name. Previously this header didn't exist in the preview at
   * all, so the real card's most prominent visual element had nothing to
   * compare against. */
  businessName?: string;
  logoUrl?: string | null;
  stampsRequired?: number;
  stampsCollected?: number;
  actionHref?: string;
  actionText?: string;
  isTemplate?: boolean;
  isActive?: boolean;
  programType?: ProgramType;
  programConfig?: ProgramConfig;
  previewOnly?: boolean;
  /** When provided, the wallet card becomes a real front/back flip card driven by this value — the Card details step. */
  flipped?: boolean;
  cardDetails?: { description?: string; terms?: string; website?: string };
  /** Small icon button rendered next to the primary action (e.g. quick "Download A4 poster"). */
  secondaryAction?: { icon: LucideIcon; label: string; onClick: () => void; loading?: boolean };
  barcodeStyle?: BarcodeStyle;
};

export function getIconComponent(iconName: string): LucideIcon {
  const icon = (LucideIcons as any)[iconName];
  return icon || LucideIcons.Star;
}

export function PhoneMockup({
  name,
  primaryColor,
  secondaryColor,
  textColor = "text-white",
  iconName = "Star",
  backgroundImage,
  businessName,
  logoUrl,
  stampsRequired = 10,
  stampsCollected = 0,
  actionHref,
  actionText = "Open",
  isTemplate = false,
  isActive,
  programType = "stamp",
  programConfig,
  previewOnly = false,
  flipped,
  cardDetails,
  secondaryAction,
  barcodeStyle = "qr",
}: PhoneMockupProps) {
  const Icon = getIconComponent(iconName);
  const reduced = useReducedMotion();
  const isFlipCard = flipped !== undefined;
  const pointsConfig = programConfig as PointsConfig | undefined;
  const stepsConfig = programConfig as StepsConfig | undefined;
  // Preview assumes "just enrolled" (now) so the countdown shows the full configured window.
  const expirationPreview = computeExpirationStatus((programConfig as CardAppearance | undefined)?.expiration, new Date());
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
          isActive ? "bg-[var(--success-soft)] text-[var(--success)]" : "bg-[var(--danger-soft)] text-[var(--danger)]"
        )}>
          <div className={cn("h-2 w-2 rounded-full", isActive ? "bg-[var(--success)]" : "bg-[var(--danger)]")} />
          {isActive ? "Active" : "Inactive"}
        </div>
      )}

      {/* Phone frame */}
      <div className={`relative ${previewOnly ? "h-[500px]" : "h-[480px]"} w-[235px] shrink-0 overflow-hidden rounded-[42px] border-[10px] border-[#2b2b2b] bg-[#f0f0f0] shadow-xl ${previewOnly ? "" : "transition-all hover:-translate-y-1 hover:shadow-2xl"}`}>
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
          <div className="px-3 [perspective:1600px]">
            <div
              className={cn(
                "relative w-full [transform-style:preserve-3d]",
                isFlipCard && !reduced && "transition-transform duration-700 ease-[cubic-bezier(0.77,0,0.175,1)]"
              )}
              style={isFlipCard && !reduced ? { transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)" } : undefined}
            >
            <div
              className={cn(
                "relative w-full overflow-hidden rounded-2xl shadow-lg",
                textColor,
                isFlipCard && "[backface-visibility:hidden]",
                isFlipCard && reduced && flipped && "hidden"
              )}
              style={{ backgroundColor: primaryColor }}
            >
              {/* Header bar — logo pinned far left, business name pinned far
                  right, matching the merchant's name/logo Apple/Google
                  actually render at the top of the real card (logoText +
                  logo.png in lib/wallet/apple.ts). */}
              <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoUrl} alt="" className="h-7 w-7 shrink-0 rounded-md object-cover" />
                ) : (
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </div>
                )}
                <p className="truncate text-sm font-bold">{businessName || name || "Business"}</p>
              </div>

              {/* Top image area — no text drawn on it, matching the real
                  generated wallet-card image exactly (Apple's strip.png /
                  Google's heroImage never bake in the program name; that's
                  shown by the platform's own native chrome instead). Every
                  program type's progress is overlaid directly on the photo
                  here, same as lib/wallet/heroImage.ts's composite for all
                  three types (stamp grid, points number+bar, steps
                  milestones) — the card only has one image slot, not a
                  separate section underneath, so a below-photo block (the
                  previous points/steps layout) never matched what actually
                  ships to Apple/Google Wallet. */}
              <div className="relative h-[168px] w-full overflow-hidden">
                {backgroundImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={backgroundImage}
                      alt={name}
                      className="h-full w-full object-cover"
                    />
                    {/* dark gradient overlay so the grid/icons stay legible */}
                    <div className="absolute inset-0 bg-black/28" />
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

                {programType === "stamp" && (() => {
                  const clampedRequired = Math.min(25, Math.max(1, stampsRequired));
                  const columns = getStampGridColumns(clampedRequired);
                  const scale = getStampCellScale(clampedRequired);
                  return (
                    <div
                      className={`absolute inset-0 grid place-content-center px-3 ${STAMP_GAP[scale]}`}
                      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
                    >
                      {Array.from({ length: clampedRequired }).map((_, i) => {
                        const filled = i < stampsCollected;
                        return (
                          <div
                            key={i}
                            className="flex aspect-square items-center justify-center rounded-full"
                            style={{
                              opacity: filled ? 1 : 0.55,
                              backgroundColor: filled ? secondaryColor : "rgba(255,255,255,0.12)",
                              border: `${STAMP_BORDER_WIDTH[scale]} solid ${filled ? secondaryColor : "rgba(255,255,255,0.6)"}`,
                            }}
                          >
                            <Icon
                              className={STAMP_ICON_SIZE[scale]}
                              style={{ color: filled ? "#fff" : secondaryColor }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Big balance + progress bar overlaid on the photo — matches
                    renderApplePointsStrip/renderPointsCardHeroImage exactly
                    (white text, thin bar), not the old white-box+dots design
                    that never appeared on a real card. */}
                {programType === "points" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-white">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold leading-none">{demoPoints}</span>
                      <span className="text-xs font-semibold opacity-90">{pointsConfig?.points_label ?? "pts"} of {pointsTarget}</span>
                    </div>
                    <div className="h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-white/25">
                      <div className="h-full rounded-full" style={{ width: `${pointsPercent}%`, backgroundColor: secondaryColor }} />
                    </div>
                  </div>
                )}

                {/* Milestone list overlaid on the photo — matches
                    renderAppleStepsStrip/renderStepsCardHeroImage's layout,
                    not a separate section below a short strip. */}
                {programType === "steps" && (
                  <div className="absolute inset-0 flex flex-col justify-center gap-1.5 px-4 text-white">
                    {stages.slice(0, 4).map((stage, index) => (
                      <div key={stage.key} className="flex items-center gap-2 text-[9px]">
                        <span className="flex h-3 w-3 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: secondaryColor, backgroundColor: index === 0 ? secondaryColor : "transparent" }} />
                        <span className={index === 0 ? "font-semibold" : "opacity-65"}>{stage.label}</span>
                        <span className="ml-auto opacity-60">{stage.threshold}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {expirationPreview && (
                <div className="mx-3 mt-2 flex items-center justify-center gap-1 rounded-full bg-white/15 px-2 py-1 text-[8px] font-semibold uppercase tracking-wide">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDaysRemaining(expirationPreview)}
                </div>
              )}

              {/* Info row — labels/values mirror lib/wallet/renderPassFields.ts
                  exactly (remainingLabel/remainingValue, secondaryLabel/
                  secondaryValue) so this preview never drifts from what the
                  real Apple/Google Wallet card actually shows. */}
              <div className="px-3 pt-3 pb-1 flex justify-between text-[9px]">
                <div>
                  <p className="opacity-60 uppercase tracking-wide">{programType === "points" ? "points to reward" : programType === "steps" ? "next milestone" : "stamps to reward"}</p>
                  <p className="font-bold text-[11px]">{programType === "points" ? `${pointsTarget - demoPoints} left` : programType === "steps" ? (stages[1]?.label ?? "Complete") : `${Math.max(0, stampsRequired - stampsCollected)} left`}</p>
                </div>
                <div className="text-right">
                  <p className="opacity-60 uppercase tracking-wide">Reward</p>
                  <p className="max-w-[84px] truncate text-[11px] font-bold">{programType === "steps" ? (stages[0]?.label ?? "Reward") : (rewardDescription ?? "Free item")}</p>
                </div>
              </div>

              {/* Barcode — same BarcodeImage every real pass/print asset uses,
                  so this preview accurately reflects the selected barcode
                  style (not just a fixed decorative mockup). The value here
                  is a placeholder: this preview has no real customer pass id
                  yet, only the visual style is meaningful. */}
              <div className="mx-3 mb-3 mt-2 flex flex-col items-center rounded-xl bg-white px-2 py-1.5">
                <BarcodeImage
                  value="00000000-0000-0000-0000-000000000000"
                  style={barcodeStyle}
                  size={barcodeStyle === "pdf417" ? 140 : 56}
                  dark="#000000"
                />
                <p className="mt-0.5 text-[8px] text-gray-400">Tap ••• for details</p>
              </div>
            </div>

            {isFlipCard && (
              <div
                className={cn(
                  "absolute inset-0 overflow-y-auto rounded-2xl shadow-lg [backface-visibility:hidden]",
                  textColor,
                  !reduced && "[transform:rotateY(180deg)]",
                  reduced && !flipped && "hidden"
                )}
                style={{ backgroundColor: primaryColor }}
              >
                <div className="px-4 py-4">
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-75">{name || "Program name"}</p>
                  <h4 className="mt-1.5 text-xs font-bold">Card details</h4>
                  <div className="mt-3 space-y-3 text-[10px] leading-relaxed">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-wide opacity-60">Reward</p>
                      <p className="mt-0.5 font-medium">
                        {programType === "steps" ? (stages[0]?.label ?? "Reward") : (rewardDescription ?? "Free item")}
                      </p>
                    </div>
                    {cardDetails?.description && (
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide opacity-60">About</p>
                        <p className="mt-0.5 whitespace-pre-line opacity-90">{cardDetails.description}</p>
                      </div>
                    )}
                    {cardDetails?.terms && (
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-wide opacity-60">Terms</p>
                        <p className="mt-0.5 whitespace-pre-line opacity-80">{cardDetails.terms}</p>
                      </div>
                    )}
                    {cardDetails?.website && (
                      <p className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" /> {cardDetails.website}
                      </p>
                    )}
                    {!cardDetails?.description && !cardDetails?.terms && !cardDetails?.website && (
                      <p className="opacity-70">Add a welcome message, terms, or a link so members know what to expect.</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
          </div>
        </div>
      </div>

      {/* Label & action */}
      {!previewOnly && <div className="w-[235px]">
        <h3 className="text-center text-sm font-semibold text-[var(--ink)] truncate">{name || "Untitled"}</h3>
        <div className="mt-2 flex items-center gap-1.5">
          {actionHref && (
            <Link
              href={actionHref}
              className={cn(
                "block flex-1 rounded-xl px-4 py-2 text-center text-sm font-semibold transition-colors active:scale-95",
                isTemplate
                  ? "bg-[var(--ink)] text-[var(--surface)] hover:opacity-90"
                  : "border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] hover:bg-[var(--surface-2)]"
              )}
            >
              {actionText}
            </Link>
          )}
          {secondaryAction && (
            <button
              type="button"
              onClick={secondaryAction.onClick}
              disabled={secondaryAction.loading}
              aria-label={secondaryAction.label}
              title={secondaryAction.label}
              className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)] active:scale-95 disabled:opacity-50"
            >
              <secondaryAction.icon className={cn("h-4 w-4", secondaryAction.loading && "animate-pulse")} strokeWidth={1.75} />
            </button>
          )}
        </div>
      </div>}
    </div>
  );
}

export function EmptyPhoneMockup({ locale }: { locale: string }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Link
        href={`/${locale}/dashboard/templates`}
        className="relative flex h-[480px] w-[235px] shrink-0 items-center justify-center rounded-[42px] border-[10px] border-dashed border-[var(--line-strong)] bg-[var(--surface-2)] shadow-sm transition-all hover:-translate-y-1 hover:border-[var(--muted)] hover:shadow-lg"
      >
        <div className="absolute top-3 left-1/2 h-5 w-24 -translate-x-1/2 rounded-full bg-[var(--surface-3)]" />
        <div className="flex flex-col items-center gap-2 text-[var(--muted)]">
          <LucideIcons.Plus className="h-12 w-12" strokeWidth={1.5} />
          <span className="text-sm font-medium">New card</span>
        </div>
      </Link>
      <div className="w-[235px] space-y-2">
        <h3 className="text-center text-sm font-semibold text-[var(--ink)]">Create card</h3>
        <Link
          href={`/${locale}/dashboard/templates`}
          className="block w-full rounded-xl bg-[var(--ink)] px-4 py-2 text-center text-sm font-semibold text-[var(--surface)] hover:opacity-90 active:scale-95"
        >
          Browse templates
        </Link>
        <Link
          href={`/${locale}/dashboard/programs/new`}
          className="block w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-center text-sm font-semibold text-[var(--muted)] hover:bg-[var(--surface-2)] active:scale-95"
        >
          From scratch
        </Link>
      </div>
    </div>
  );
}
