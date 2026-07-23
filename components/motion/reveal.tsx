"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/motion/gsap";
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

/**
 * Single-element fade-up entrance, replacing the old `.animate-stagger-*` CSS
 * classes with a reusable GSAP version usable on any page (not just dashboard home).
 * No-ops (renders statically) under prefers-reduced-motion.
 */
export function Reveal({ children, className, as = "div", delay = 0, y = 20, repeat = false }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      if (reduced || !ref.current) return;
      gsap.fromTo(
        ref.current,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          delay,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ref.current,
            start: "top 88%",
            toggleActions: repeat ? "play reset play reset" : "play none none none",
          },
        }
      );
    },
    { scope: ref, dependencies: [reduced] }
  );

  const Tag = as;
  return (
    <Tag ref={ref as never} className={cn(reduced ? "" : "opacity-0", className)}>
      {children}
    </Tag>
  );
}
