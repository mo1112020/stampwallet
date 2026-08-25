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
 * That also explains a "bottom nav nudges up on every navigation" report seen
 * with an earlier version of this shell: Next's own built-in
 * scroll-and-focus restoration (node_modules/next/dist/client/components/
 * layout-router.js, handlePotentialScroll) runs on *every* route change and,
 * whenever it finds the newly-mounted page's root node scrolled out of view
 * — guaranteed here since nothing reset `main`'s scrollTop — calls
 * `domNode.scrollIntoView()`. `main` is the only element in this shell that
 * can scroll at all (the shell itself is `fixed inset-0`, out of document
 * flow — see app/[locale]/dashboard/layout.tsx — so <body> has no scrollable
 * content of its own), so the browser resolves that `scrollIntoView()`
 * against `main`: a native, framework-driven scroll adjustment firing on
 * every navigation, independent of anything this component does.
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
