"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
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

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Fade-up-staggers its children once they scroll into view, via
 * IntersectionObserver + CSS transitions rather than GSAP + ScrollTrigger —
 * see components/motion/reveal.tsx for why. For card grids / KPI rows — the
 * group entrance IS the hierarchy cue, so this only ever plays once (no
 * looping), per "motion must be motivated."
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

  // Sets the pre-reveal hidden state synchronously, before the browser's
  // first paint — a plain useEffect here would let children flash fully
  // visible for a frame before snapping hidden, since it runs after paint.
  useLayoutEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(itemSelector);
    items.forEach((item, index) => {
      item.style.transition = `opacity 0.55s ${EASE} ${index * stagger}s, transform 0.55s ${EASE} ${index * stagger}s`;
      item.style.opacity = "0";
      item.style.transform = `translateY(${y}px)`;
    });
  }, [reduced, itemSelector, stagger, y]);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.querySelectorAll<HTMLElement>(itemSelector).forEach((item) => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        });
        observer.unobserve(el);
      },
      { rootMargin: "0px 0px -10% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, itemSelector]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
