"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

/**
 * Wraps the "how it works" step row and turns the static connecting ledger
 * rule into the focal moment: once scrolled into view (desktop only, where
 * the rule exists), it draws through the row and each step box catches a
 * genuine ink-stamp impression — a hard punch-in with overshoot and a brief
 * ink fill — as the rule reaches it, literalizing this direction's
 * signature interaction ("things get stamped, not faded") on the flow the
 * steps already describe ("scan → join → wallet → earn → reward"). Finds
 * its targets via data attributes rather than refs so the step markup,
 * including the server-rendered icons, is untouched.
 */
export function HowItWorksTimeline({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || window.innerWidth < 768) return;
      const line = containerRef.current?.querySelector<HTMLElement>("[data-connector-line]");
      const icons = Array.from(containerRef.current?.querySelectorAll<HTMLElement>("[data-step-icon]") ?? []);
      if (!line || icons.length === 0) return;

      // Drawn full-width by default (the static, pre-JS/reduced-motion
      // frame) — only collapsed here, right before animating it back open.
      gsap.set(line, { scaleX: 0 });

      const tl = gsap.timeline({
        delay: 0.7,
        scrollTrigger: { trigger: containerRef.current, start: "top 75%", once: true },
      });

      const drawDuration = 0.75;
      tl.to(line, { scaleX: 1, duration: drawDuration, ease: "power2.out" });

      icons.forEach((icon, i) => {
        const at = ((i + 0.5) / icons.length) * drawDuration;
        // The punch: overshoot in with a slight crooked rotation (a stamp
        // never lands perfectly square), then settle back flat.
        tl.fromTo(icon, { rotate: 0, scale: 1 }, { rotate: -8, scale: 1.3, duration: 0.12, ease: "power1.out" }, at);
        tl.to(icon, { rotate: 0, scale: 1, duration: 0.22, ease: "back.out(2.5)" }, at + 0.12);
        // The ink: a brief solid fill, like pressed ink on paper, fading
        // back to the resting outline rather than staying filled.
        tl.to(
          icon,
          {
            backgroundColor: "var(--primary)",
            color: "var(--primary-foreground)",
            duration: 0.1,
            ease: "power1.out",
            yoyo: true,
            repeat: 1,
            repeatDelay: 0.14,
          },
          at
        );
      });
    },
    { dependencies: [reduced], scope: containerRef }
  );

  return <div ref={containerRef}>{children}</div>;
}
