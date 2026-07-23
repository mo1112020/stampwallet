"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

type StaggerGroupProps = {
  children: React.ReactNode;
  className?: string;
  /** CSS selector (relative to the group) for the items to stagger — defaults to direct children via `:scope > *`. */
  itemSelector?: string;
  stagger?: number;
  y?: number;
};

/**
 * Fade-up-staggers its children once they scroll into view. For card grids /
 * KPI rows — the group entrance IS the hierarchy cue, so this only ever plays
 * once (no looping), per "motion must be motivated."
 */
export function StaggerGroup({
  children,
  className,
  itemSelector = ":scope > *",
  stagger = 0.08,
  y = 18,
}: StaggerGroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      const items = ref.current.querySelectorAll(itemSelector);
      if (!items.length) return;
      gsap.fromTo(
        items,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.55,
          stagger,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    },
    { scope: ref, dependencies: [reduced] }
  );

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
