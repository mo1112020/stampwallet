"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

type StaggerGroupProps = {
  children: React.ReactNode;
  className?: string;
  /** Element tag to render as. Defaults to div — "ol"/"ul" for groups whose
   * children are semantically a list (e.g. li's), matching Reveal's same
   * polymorphic `as` pattern. */
  as?: "div" | "ol" | "ul";
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
  as = "div",
  itemSelector = ":scope > *",
  stagger = 0.08,
  y = 18,
}: StaggerGroupProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();

  // Sets the pre-reveal hidden state synchronously, before the browser's
  // first paint — a plain useEffect here would let children flash fully
  // visible for a frame before snapping hidden, since it runs after paint.
  // `reduced` starts false (useReducedMotion's own detection is itself
  // effect-based) and can flip true on a later render — without the else
  // branch, items hidden by that first false-render pass would stay
  // opacity:0 forever once `reduced` becomes true, since nothing else ever
  // clears an inline style an effect didn't just set.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>(itemSelector);
    if (reduced) {
      items.forEach((item) => {
        item.style.transition = "";
        item.style.opacity = "";
        item.style.transform = "";
      });
      return;
    }
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

  const Comp = as;
  return (
    <Comp ref={ref as never} className={cn(className)}>
      {children}
    </Comp>
  );
}
