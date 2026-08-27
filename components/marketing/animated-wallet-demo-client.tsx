"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { Coffee, Gift } from "lucide-react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

const STAMPS_TOTAL = 8;
// Matches WalletPreviewCard's own default (5 of 8) — the frame a
// reduced-motion visitor sees, and also this component's own resting frame
// between loops.
const STAMPS_AT_REST = 5;

/**
 * The animated version of WalletPreviewCard (see that file for the visual
 * design this mirrors) — same phone/card chrome, but the stamp grid fills
 * in on a loop and a wallet-native notification slides in when the reward
 * unlocks, instead of a single static frame. That notification is the
 * point: it's this product's actual differentiator (renderPassFields /
 * lib/wallet/push.ts — updates land directly on the pass, no separate app),
 * so the demo should show it happening, not just describe it in copy
 * elsewhere on the page.
 */
export function AnimatedWalletDemoClient({
  platform,
  primaryColor,
  secondaryColor,
  qrSvg,
  className,
}: {
  platform: "apple" | "google";
  primaryColor: string;
  secondaryColor: string;
  qrSvg: string;
  className?: string;
}) {
  const badgeSrc = platform === "apple" ? "/images/Apple_Wallet_icon.svg" : "/images/Google_Wallet_icon.svg";
  const badgeLabel = platform === "apple" ? "Apple Wallet" : "Google Wallet";
  // Intrinsic width at the rendered h-3.5 (14px) height, from each SVG's own
  // viewBox aspect ratio — explicit width/height lets the browser reserve
  // layout space before the image loads instead of shifting content in.
  const badgeWidth = platform === "apple" ? 19 : 16;

  const reduced = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const stampRefs = useRef<(HTMLDivElement | null)[]>([]);
  const stampIconRefs = useRef<(SVGSVGElement | null)[]>([]);
  const infoRowRef = useRef<HTMLDivElement>(null);
  const rewardBannerRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (reduced) return;
      const stamps = stampRefs.current.filter((el): el is HTMLDivElement => el !== null);
      const icons = stampIconRefs.current.filter((el): el is SVGSVGElement => el !== null);
      if (stamps.length !== STAMPS_TOTAL || !infoRowRef.current || !rewardBannerRef.current || !notificationRef.current) return;

      const fillStamp = (i: number) => {
        gsap.to(stamps[i], {
          backgroundColor: secondaryColor,
          borderColor: secondaryColor,
          duration: 0.25,
          ease: "power2.out",
        });
        gsap.to(icons[i], { color: "#ffffff", duration: 0.25 });
        gsap.fromTo(stamps[i], { scale: 1 }, { scale: 1.18, duration: 0.18, yoyo: true, repeat: 1, ease: "power1.inOut" });
      };
      const resetStamp = (i: number) => {
        gsap.set(stamps[i], { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.6)", scale: 1 });
        gsap.set(icons[i], { color: secondaryColor });
      };

      // Starts already at rest (5/8, matching the reduced-motion frame) so
      // there's something reasonable on screen before the timeline's first
      // loop reaches that same point again.
      for (let i = 0; i < STAMPS_TOTAL; i++) resetStamp(i);
      for (let i = 0; i < STAMPS_AT_REST; i++) {
        gsap.set(stamps[i], { backgroundColor: secondaryColor, borderColor: secondaryColor });
        gsap.set(icons[i], { color: "#ffffff" });
      }
      gsap.set(notificationRef.current, { y: -16, opacity: 0 });
      gsap.set(rewardBannerRef.current, { opacity: 0 });

      const tl = gsap.timeline({ repeat: -1, delay: 1 });

      for (let i = STAMPS_AT_REST; i < STAMPS_TOTAL; i++) {
        tl.call(() => fillStamp(i)).to({}, { duration: 0.45 });
      }

      // Reward unlocked: info row crossfades to the reward banner, and a
      // lock-screen-style notification slides down from above the card —
      // the actual mechanism (see lib/wallet/push.ts) this product uses in
      // place of a separate customer-facing app.
      tl.to(infoRowRef.current, { opacity: 0, duration: 0.25 })
        .to(rewardBannerRef.current, { opacity: 1, duration: 0.25 }, "<")
        .to(notificationRef.current, { y: 0, opacity: 1, duration: 0.4, ease: "back.out(1.7)" }, "-=0.1")
        .to({}, { duration: 2.2 })
        .to(notificationRef.current, { y: -16, opacity: 0, duration: 0.3, ease: "power1.in" })
        .to(rewardBannerRef.current, { opacity: 0, duration: 0.25 })
        .to(infoRowRef.current, { opacity: 1, duration: 0.25 }, "<")
        .to({}, { duration: 0.6 })
        .call(() => {
          for (let i = STAMPS_AT_REST; i < STAMPS_TOTAL; i++) resetStamp(i);
        })
        .to({}, { duration: 0.8 });

      return () => {
        tl.kill();
      };
    },
    { dependencies: [reduced, secondaryColor], scope: containerRef }
  );

  return (
    <div className={cn("relative mx-auto h-[420px] w-[210px] shrink-0", className)} ref={containerRef}>
      {/* Lock-screen-style notification, positioned above the phone frame
       * so it reads as arriving "on the device" rather than inside the
       * card UI itself — matches how these updates actually show up. */}
      <div
        ref={notificationRef}
        aria-hidden="true"
        className="absolute -top-3 left-1/2 z-30 w-[190px] -translate-x-1/2 rounded-2xl bg-[#1c1c1e]/95 px-3 py-2 text-white shadow-lg backdrop-blur"
        style={reduced ? { display: "none" } : undefined}
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: primaryColor }}>
            <Gift className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold leading-tight">Your Business</p>
            <p className="truncate text-[9px] leading-tight text-white/80">Free coffee is ready to redeem 🎉</p>
          </div>
        </div>
      </div>

      <div className="relative h-full w-full overflow-hidden rounded-[38px] border-[8px] border-[var(--ink)] bg-white shadow-[6px_6px_0_0_var(--ink)]">
        <div className="absolute top-2.5 left-1/2 z-20 h-4 w-20 -translate-x-1/2 rounded-full bg-black" aria-hidden="true" />
        <div className="h-9" />
        <div className="px-2.5">
          <div className="mb-2 flex items-center gap-1.5 px-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={badgeSrc} alt="" aria-hidden="true" width={badgeWidth} height={14} className="h-3.5 w-auto" />
            <span className="text-[9px] font-medium text-[var(--muted)]">{badgeLabel}</span>
          </div>
          <div className="overflow-hidden rounded-2xl text-white shadow-lg" style={{ backgroundColor: primaryColor }}>
            <div
              className="relative h-[150px] w-full overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${secondaryColor}99, ${primaryColor})` }}
            >
              <div
                className="absolute inset-0 grid place-content-center gap-1.5 px-3"
                style={{ gridTemplateColumns: "repeat(4, minmax(0, 1fr))" }}
                aria-hidden="true"
              >
                {Array.from({ length: STAMPS_TOTAL }).map((_, i) => (
                  <div
                    key={i}
                    ref={(el) => {
                      stampRefs.current[i] = el;
                    }}
                    className="flex h-6 w-6 items-center justify-center rounded-full border"
                    style={{
                      backgroundColor: i < STAMPS_AT_REST ? secondaryColor : "rgba(255,255,255,0.12)",
                      borderColor: i < STAMPS_AT_REST ? secondaryColor : "rgba(255,255,255,0.6)",
                    }}
                  >
                    <Coffee
                      ref={(el) => {
                        stampIconRefs.current[i] = el;
                      }}
                      className="h-3 w-3"
                      style={{ color: i < STAMPS_AT_REST ? "#fff" : secondaryColor }}
                      strokeWidth={2}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* info row and reward banner occupy the same slot, crossfaded
             * by the timeline rather than swapped — avoids a layout jump. */}
            <div className="relative">
              <div ref={infoRowRef} className="flex items-center justify-between px-3 pt-2.5 pb-1 text-[9px]">
                <div>
                  <p className="uppercase tracking-wide opacity-60">Stamps to reward</p>
                  <p className="text-[11px] font-bold">{STAMPS_TOTAL - STAMPS_AT_REST} left</p>
                </div>
                <div className="text-end">
                  <p className="uppercase tracking-wide opacity-60">Reward</p>
                  <p className="text-[11px] font-bold">Free coffee</p>
                </div>
              </div>
              <div
                ref={rewardBannerRef}
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center px-3 pt-2.5 pb-1 text-[11px] font-bold opacity-0"
              >
                🎁 Reward ready to redeem
              </div>
            </div>

            <div className="mx-3 mb-3 mt-2 flex flex-col items-center rounded-xl bg-white px-2 py-1.5">
              <div className="flex h-14 w-14 items-center justify-center" dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="mt-0.5 text-[7px] text-gray-400">Tap ••• for details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
