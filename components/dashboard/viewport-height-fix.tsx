"use client";

import { useEffect } from "react";

/**
 * iOS Safari never shrinks the CSS layout viewport (what `dvh`/`vh` and
 * `window.innerHeight` are computed from) when the on-screen keyboard opens —
 * it just auto-scrolls the document to keep the focused input visible,
 * dragging the dashboard's fixed-height shell (topbar + bottom nav) along
 * with it. `window.visualViewport`, unlike those CSS units, *does* correctly
 * report the shrunk height on iOS, so we track it here and expose it as a
 * CSS var the shell sizes itself from instead. (Chromium's `dvh` already
 * handles its own keyboard behavior via the `interactive-widget` viewport
 * meta in app/layout.tsx — this covers the browser that doesn't.)
 */
export function DashboardViewportHeightFix() {
  useEffect(() => {
    const vv = window.visualViewport;
    const root = document.documentElement;

    const set = () => {
      const height = vv?.height ?? window.innerHeight;
      root.style.setProperty("--app-dvh", `${height}px`);
    };

    set();

    if (vv) {
      vv.addEventListener("resize", set);
      vv.addEventListener("scroll", set);
    } else {
      window.addEventListener("resize", set);
    }

    // Belt-and-suspenders: the shell is sized to exactly match the visible
    // area above, so body should never need to scroll — but locking it
    // outright means an iOS Safari focus-scroll can't drag the fixed shell
    // (topbar/bottom nav) even for a single stale frame while --app-dvh
    // catches up. Scoped to this component's lifetime, so other routes
    // (marketing pages etc.) keep normal document scrolling.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // `overflow: hidden` on body stops touch-drag scrolling but NOT iOS
    // Safari's own focus-triggered auto-scroll — confirmed on-device: tapping
    // an input mid-form still scrolls the whole document (not just `main`),
    // shoving the topbar off the top of the screen and leaving dead space
    // above the keyboard, even though `main` itself never moved. Since this
    // shell is designed so the document never legitimately needs to scroll
    // (all scrolling happens inside `main`), snapping any nonzero
    // window scroll straight back to 0 is a safe, generic backstop rather
    // than a fix for one specific input/page.
    const resetDocumentScroll = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };
    window.addEventListener("scroll", resetDocumentScroll, { passive: true });

    return () => {
      if (vv) {
        vv.removeEventListener("resize", set);
        vv.removeEventListener("scroll", set);
      } else {
        window.removeEventListener("resize", set);
      }
      window.removeEventListener("scroll", resetDocumentScroll);
      root.style.removeProperty("--app-dvh");
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return null;
}
