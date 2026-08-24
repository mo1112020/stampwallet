"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Nothing in this shell ever reset `<main id="dashboard-main">`'s scroll
 * position between pages (it's a persistent element across client-side
 * navigations — only its children, inside app/[locale]/dashboard/template.tsx,
 * remount). Scroll down on a long page (e.g. Customers), tap a bottom-nav
 * link, and the next page silently opened mid-scroll instead of at the top.
 *
 * That also explains the "bottom nav nudges up on every navigation" report:
 * Next's own built-in scroll-and-focus restoration
 * (node_modules/next/dist/client/components/layout-router.js,
 * handlePotentialScroll) runs on *every* route change and, whenever it finds
 * the newly-mounted page's root node scrolled out of view — guaranteed here
 * since nothing reset `main`'s scrollTop — calls `domNode.scrollIntoView()`.
 * Because this shell locks document/body scrolling (see
 * viewport-height-fix.tsx), the browser resolves that `scrollIntoView()`
 * against the nearest real scrollable ancestor, which is `main` itself: a
 * native, framework-driven scroll adjustment firing on every navigation,
 * completely outside this shell's own `--app-dvh`/visualViewport system.
 * That's exactly the kind of native scroll activity that can nudge a mobile
 * browser's chrome (address bar) and produce a late `visualViewport`
 * resize/scroll event — which is what actually moves the bottom nav, a frame
 * after the page has already painted.
 *
 * Resetting `main` to the top ourselves, synchronously, before Next's handler
 * gets a chance to evaluate the new page's position, fixes both: pages open
 * at the top like they should, and Next's own geometry check now finds the
 * new page's root node already in view — so it skips scrollIntoView/focus
 * entirely. This needs to run in a `useLayoutEffect` in a component mounted
 * *before* `<main>` in the layout tree (see dashboard/layout.tsx) so it
 * commits ahead of the nested layout-router's own scroll handler in the same
 * commit.
 */
export function ScrollResetOnNavigate() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const main = document.getElementById("dashboard-main");
    if (main) main.scrollTop = 0;
  }, [pathname]);

  return null;
}
