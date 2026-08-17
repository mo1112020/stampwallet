"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { ExternalLink, Move, type LucideIcon } from "lucide-react";
import type { BackgroundImagePosition, BarcodeStyle, CardAppearance, PointsConfig, ProgramConfig, ProgramType, StepsConfig } from "@/types";
import { BarcodeImage } from "@/components/dashboard/print/barcode-image";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { solveStampGridCell } from "@/lib/stamp-grid";
import { STRIP_WIDTH_1X, STRIP_HEIGHT_1X } from "@/lib/wallet/stripDimensions";
import { computeExpirationStatus, formatDaysRemaining } from "@/lib/wallet/expiration";

// Apple's own strip image is a fixed-ratio banner (see stripDimensions.ts —
// imported, not hardcoded here again, so this preview can't drift out of
// sync with the real render a second time). The card here is always
// MOCKUP_STRIP_WIDTH px wide (235px phone frame - 20px border - 24px inner
// padding), so the strip height is derived from Apple's real ratio rather
// than guessed, and the stamp grid below solves cell size from these exact
// pixels using the same solveStampGridCell formula the real Apple render
// uses — previously this preview used a fixed lg/md/sm/xs size table tuned
// for Google's much taller canvas, which is why it never matched what
// actually ships to a customer's iPhone.
const MOCKUP_STRIP_WIDTH = 191;
// Deliberately a bit taller than Apple's exact ratio would give (that ratio
// is still what's used for cell/text sizing math below, via
// STRIP_HEIGHT_1X) — at this preview's small physical size, the exact
// strip proportions read as too cramped to comfortably preview text/icon
// legibility while designing a card, even though they're what actually
// ships. This multiplier only affects the preview's on-screen height, not
// STRIP_WIDTH_1X/STRIP_HEIGHT_1X (the shared source of truth heroImage.ts's
// real Apple/Google render also uses), so it can never leak into what a
// customer's real card looks like.
const MOCKUP_STRIP_HEIGHT_BOOST = 1.15;
const MOCKUP_STRIP_HEIGHT = Math.round((MOCKUP_STRIP_WIDTH * STRIP_HEIGHT_1X * MOCKUP_STRIP_HEIGHT_BOOST) / STRIP_WIDTH_1X);
const MOCKUP_STRIP_PADDING = Math.round((18 * MOCKUP_STRIP_WIDTH) / STRIP_WIDTH_1X);

export type PhoneMockupProps = {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  textColor?: string;
  iconName?: string;
  backgroundImage?: string;
  /** 0-100 percentages, CSS object-position semantics. Defaults to
   * centered. Only meaningful when backgroundImage is set. */
  backgroundImagePosition?: BackgroundImagePosition;
  /** Presence of this handler (not just a truthy backgroundImage) is what
   * turns on drag-to-reposition on the strip photo — every read-only
   * PhoneMockup use (Programs grid, Templates gallery, EmptyPhoneMockup)
   * simply never passes it, so dragging the card there does nothing rather
   * than silently trying to "edit" a card the user can't actually save. */
  onBackgroundImagePositionChange?: (position: BackgroundImagePosition) => void;
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
  backgroundImagePosition,
  onBackgroundImagePositionChange,
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
  const canReposition = Boolean(onBackgroundImagePositionChange && backgroundImage);
  const posX = backgroundImagePosition?.x ?? 50;
  const posY = backgroundImagePosition?.y ?? 50;
  const stripRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState(false);

  function positionFromPointer(e: { clientX: number; clientY: number }) {
    const el = stripRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    onBackgroundImagePositionChange?.({ x: Math.round(x), y: Math.round(y) });
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!canReposition) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    positionFromPointer(e);
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!canReposition || !dragging) return;
    positionFromPointer(e);
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (!canReposition) return;
    e.currentTarget.releasePointerCapture(e.pointerId);
    setDragging(false);
  }
  const pointsConfig = programConfig as PointsConfig | undefined;
  const stepsConfig = programConfig as StepsConfig | undefined;
  // Preview assumes "just enrolled" (now) so the countdown shows the full configured window.
  const expirationPreview = computeExpirationStatus((programConfig as CardAppearance | undefined)?.expiration, new Date());
  const rewardDescription = (programConfig as { reward_description?: string } | undefined)?.reward_description;
  const pointsTarget = pointsConfig?.points_per_reward ?? 1000;
  const demoPoints = Math.min(420, pointsTarget);
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
              <div
                ref={stripRef}
                className={cn("relative w-full overflow-hidden", canReposition && "touch-none", canReposition && (dragging ? "cursor-grabbing" : "cursor-grab"))}
                style={{ height: MOCKUP_STRIP_HEIGHT }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                {backgroundImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={backgroundImage}
                      alt={name}
                      draggable={false}
                      className="h-full w-full object-cover"
                      style={{ objectPosition: `${posX}% ${posY}%` }}
                    />
                    {/* dark gradient overlay so the grid/icons stay legible */}
                    <div className="absolute inset-0 bg-black/28" />
                    {canReposition && (
                      <div
                        className={cn(
                          "pointer-events-none absolute end-1.5 top-1.5 flex items-center gap-1 rounded-full bg-black/45 px-1.5 py-1 text-white transition-opacity",
                          dragging ? "opacity-100" : "opacity-60"
                        )}
                      >
                        <Move className="h-2.5 w-2.5" strokeWidth={2} />
                      </div>
                    )}
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
                  const { columns, rows, cell, gap } = solveStampGridCell({
                    stampsRequired: clampedRequired,
                    width: MOCKUP_STRIP_WIDTH,
                    height: MOCKUP_STRIP_HEIGHT,
                    padding: MOCKUP_STRIP_PADDING,
                    minCell: 6,
                  });
                  return (
                    <div
                      className="absolute inset-0 grid place-content-center"
                      style={{ gridTemplateColumns: `repeat(${columns}, ${cell}px)`, gridTemplateRows: `repeat(${rows}, ${cell}px)`, gap }}
                    >
                      {Array.from({ length: clampedRequired }).map((_, i) => {
                        const filled = i < stampsCollected;
                        const iconSize = cell * 0.6;
                        return (
                          // Unfilled stamps sit on top of a photo, so the old
                          // 0.55 group opacity (compounding with an already
                          // translucent fill/border) left them barely
                          // readable against a busy background. Full opacity
                          // with a stronger scrim + border keeps "not earned
                          // yet" visually distinct from "earned" while still
                          // being clearly visible.
                          <div
                            key={i}
                            className="flex items-center justify-center rounded-full"
                            style={{
                              width: cell,
                              height: cell,
                              backgroundColor: filled ? secondaryColor : "rgba(0,0,0,0.35)",
                              border: `1px solid ${filled ? secondaryColor : "rgba(255,255,255,0.85)"}`,
                            }}
                          >
                            {/* OpenMoji icons (see lib/wallet/stampIconAssets.ts
                             * for the same set embedded server-side) are already
                             * full color, not a recolorable single-tone icon
                             * like the old Lucide set — "not yet earned" is
                             * expressed by desaturating + dimming instead. */}
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={`/icons/stamp/${iconName}.svg`}
                              alt=""
                              // A program's icon name has to independently
                              // match a bundled file (see stampIconAssets.ts
                              // for the source of truth) — the server side
                              // already falls back to Star when the name
                              // doesn't match; this is the same fallback for
                              // this client-rendered <img>, which would
                              // otherwise just silently 404 into a blank
                              // stamp with no visible error at all.
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.src.endsWith("/Star.svg")) img.src = "/icons/stamp/Star.svg";
                              }}
                              style={{
                                width: iconSize,
                                height: iconSize,
                                filter: filled ? undefined : "grayscale(1)",
                                opacity: filled ? 1 : 0.55,
                              }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}

                {/* Big balance + label overlaid on the photo, matching
                    renderApplePointsStrip exactly — centered as a group, no
                    progress bar. A bar used to be drawn here (and on the
                    real card), but checking against a live points card on
                    a real iPhone confirmed there isn't one there. */}
                {programType === "points" && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 px-4 text-white">
                    <span className="text-lg font-bold leading-none">{demoPoints}</span>
                    <span className="text-[7px] font-semibold opacity-90">{pointsConfig?.points_label ?? "pts"} of {pointsTarget}</span>
                  </div>
                )}

                {/* Milestone list overlaid on the photo — matches
                    renderAppleStepsStrip's layout, capped at 3 visible
                    stages like the real render (no room for a 4th at Apple's
                    actual strip height). */}
                {programType === "steps" && (
                  <div className="absolute inset-0 flex flex-col justify-center gap-0.5 px-3 text-white">
                    {stages.slice(0, 3).map((stage, index) => (
                      <div key={stage.key} className="flex items-center gap-1.5 text-[6.5px] leading-none">
                        <span className="flex h-2 w-2 shrink-0 items-center justify-center rounded-full border" style={{ borderColor: secondaryColor, backgroundColor: index === 0 ? secondaryColor : "transparent" }} />
                        <span className={index === 0 ? "font-semibold" : "opacity-65"}>{stage.label}</span>
                        <span className="ml-auto opacity-60">{stage.threshold}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Info row — labels/values AND layout mirror the real Apple/
                  Google card exactly: Apple renders secondaryFields (Reward)
                  and auxiliaryFields (next milestone, then expiry when
                  enabled) as left-aligned columns in one row — there's no
                  "badge" styling available for expiry, it's a plain field
                  like the other two, so it belongs in this row rather than
                  as a standalone pill above it (the previous design here). */}
              {/* Two columns, not three: this mockup card is ~211px wide vs a
                  real phone's ~390px, so squeezing Reward/Next/Expires onto
                  one row truncated every value to an unreadable fragment
                  ("Free ...", "10% Di...", "12 days re..."). Expiry drops to
                  its own line below instead — same fields and order as the
                  real card, just reflowed for the narrower preview. */}
              <div className="grid grid-cols-2 gap-x-3 gap-y-2 px-3 pt-3 pb-1 text-[9px]">
                <div className="min-w-0">
                  <p className="opacity-60 uppercase tracking-wide">Reward</p>
                  <p className="truncate text-[11px] font-bold">{programType === "steps" ? (stages[0]?.label ?? "Reward") : (rewardDescription ?? "Free item")}</p>
                </div>
                <div className="min-w-0 text-end">
                  <p className="opacity-60 uppercase tracking-wide">{programType === "points" ? "points to reward" : programType === "steps" ? "next milestone" : "stamps to reward"}</p>
                  <p className="truncate text-[11px] font-bold">{programType === "points" ? `${pointsTarget - demoPoints} left` : programType === "steps" ? (stages[1]?.label ?? "Complete") : `${Math.max(0, stampsRequired - stampsCollected)} left`}</p>
                </div>
                {expirationPreview && (
                  <div className="col-span-2 min-w-0 border-t border-white/15 pt-2">
                    <p className="opacity-60 uppercase tracking-wide">Expires</p>
                    <p className="truncate text-[11px] font-bold">{formatDaysRemaining(expirationPreview)}</p>
                    {/* Always the full configured window, as if a member
                        joined today — a real member's card counts down from
                        THEIR join date, so it legitimately shows fewer days
                        the longer they've been enrolled. Without this note
                        that reads as a mismatch against a real card. */}
                    <p className="mt-0.5 text-[7px] opacity-50">For a member joining today</p>
                  </div>
                )}
              </div>

              {/* Barcode — same BarcodeImage every real pass/print asset uses,
                  so this preview accurately reflects the selected barcode
                  style (not just a fixed decorative mockup). The value here
                  is a placeholder: this preview has no real customer pass id
                  yet, only the visual style is meaningful. No caption below
                  it — "Tap ••• for details" was preview-only instructional
                  copy that never appears on the real Apple/Google card, so
                  it read as a mismatch when compared side by side. */}
              <div className="mx-3 mb-3 mt-2 flex flex-col items-center rounded-xl bg-white px-2 py-1.5">
                <BarcodeImage
                  value="00000000-0000-0000-0000-000000000000"
                  style={barcodeStyle}
                  size={barcodeStyle === "pdf417" ? 140 : 56}
                  dark="#000000"
                />
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
