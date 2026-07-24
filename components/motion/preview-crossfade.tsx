"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";

type Panel = { key: string; content: React.ReactNode };

/**
 * Crossfades between two live-preview panels (e.g. wallet card vs. join page) that are
 * driven by wizard step, not a direct user click — so the switch should read as one
 * continuous scene, not a page reload. Both panels stay mounted; GSAP fades/settles
 * between them instead of remounting on a `key` change (which would kill any exit motion).
 */
export function PreviewCrossfade({ activeKey, panels }: { activeKey: string; panels: Panel[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const hasPositionedRef = useRef(false);
  const reduced = useReducedMotion();

  useGSAP(
    () => {
      const firstRun = !hasPositionedRef.current;
      hasPositionedRef.current = true;

      for (const { key } of panels) {
        const el = nodeRefs.current.get(key);
        if (!el) continue;
        const active = key === activeKey;

        if (reduced || firstRun) {
          gsap.set(el, {
            opacity: active ? 1 : 0,
            scale: 1,
            y: 0,
            pointerEvents: active ? "auto" : "none",
          });
          continue;
        }

        gsap.to(el, {
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.96,
          y: active ? 0 : 10,
          duration: active ? 0.5 : 0.35,
          ease: active ? "power3.out" : "power2.in",
          pointerEvents: active ? "auto" : "none",
        });
      }
    },
    { dependencies: [activeKey, reduced], scope: containerRef }
  );

  return (
    <div ref={containerRef} className="relative h-full w-full">
      {panels.map(({ key, content }) => (
        <div
          key={key}
          ref={(el) => {
            if (el) nodeRefs.current.set(key, el);
            else nodeRefs.current.delete(key);
          }}
          className="absolute inset-x-0 top-4 flex justify-center opacity-0"
        >
          {content}
        </div>
      ))}
    </div>
  );
}
