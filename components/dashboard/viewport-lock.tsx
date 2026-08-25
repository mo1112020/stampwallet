"use client";

import { useEffect } from "react";

/**
 * The dashboard shell (`app/[locale]/dashboard/layout.tsx`) is
 * `position: fixed; inset: 0`, taken completely out of the normal document
 * flow. That's the key architectural change from the previous shell (which
 * was an in-flow `height: 100dvh` div): a fixed/absolute box with both
 * `top` and `bottom` set resolves its height from those offsets per the CSS
 * spec, so it always exactly fills the real viewport with zero JS and zero
 * `dvh` tracking — no per-frame height var to keep in sync with the
 * browser's own chrome animation, which is what the old shell's `--app-dvh`
 * machinery was fighting a losing battle against.
 *
 * Because the shell is out-of-flow, it contributes nothing to <body>'s own
 * content height, so <body> has nothing to scroll in the first place —
 * unlike the old shell, there's no reliance on `overflow: hidden` actually
 * *working* against iOS Safari's focus-triggered auto-scroll-into-view (it
 * didn't: `overflow: hidden` blocks touch-drag scrolling but not that
 * specific browser-driven scroll, which is exactly what dragged the old
 * fixed-height-but-in-flow shell — topbar and bottom nav included — up and
 * down the page on every input focus). There's structurally nothing left
 * for that behavior to act on here.
 *
 * This still sets `overflow: hidden` on <html>/<body> anyway, but only as a
 * defensive, static belt-and-suspenders against rubber-band/pull-to-refresh
 * gestures on the empty body — not because correctness depends on it. No
 * resize/scroll listeners, no scrollTo backstop: those were reactive patches
 * for a shell that could still be pulled out of place; this shell can't be.
 */
export function DashboardViewportLock() {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = {
      htmlOverflow: html.style.overflow,
      bodyOverflow: body.style.overflow,
      bodyOverscrollBehaviorY: body.style.overscrollBehaviorY,
    };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.overscrollBehaviorY = "none";

    return () => {
      html.style.overflow = previous.htmlOverflow;
      body.style.overflow = previous.bodyOverflow;
      body.style.overscrollBehaviorY = previous.bodyOverscrollBehaviorY;
    };
  }, []);

  return null;
}
