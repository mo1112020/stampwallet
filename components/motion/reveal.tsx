"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Element tag to render as. Defaults to div. */
  as?: "div" | "section" | "li" | "h2" | "h3";
  delay?: number;
  y?: number;
  /** Re-run on every scroll into view instead of once. Off by default — most entrances should only happen once. */
  repeat?: boolean;
};

const EASE = "cubic-bezier(0.16, 1, 0.3, 1)";

/**
 * Single-element fade-up entrance via IntersectionObserver + a CSS
 * transition — no animation library needed for "fade in once scrolled into
 * view," and pulling one in just for that (GSAP + ScrollTrigger, previously)
 * cost every page that renders this component real bytes and JS execution
 * time for a two-property transition. No-ops (renders statically) under
 * prefers-reduced-motion.
 */
export function Reveal({ children, className, as = "div", delay = 0, y = 20, repeat = false }: RevealProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = useReducedMotion();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          if (!repeat) observer.unobserve(el);
        } else if (repeat) {
          setVisible(false);
        }
      },
      { rootMargin: "0px 0px -12% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, repeat]);

  const Tag = as;
  const style: React.CSSProperties | undefined = reduced
    ? undefined
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : `translateY(${y}px)`,
        transition: `opacity 0.6s ${EASE} ${delay}s, transform 0.6s ${EASE} ${delay}s`,
      };

  return (
    <Tag ref={ref as never} className={cn(className)} style={style}>
      {children}
    </Tag>
  );
}
