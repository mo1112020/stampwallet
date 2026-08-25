import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DashboardNav, DashboardMobileNav } from "@/components/dashboard/nav";
import { getSessionOrNull } from "@/lib/api";
import { getAuthUser } from "@/lib/supabase/server";

import { DashboardTopbar } from "@/components/dashboard/topbar";
import { DashboardViewportLock } from "@/components/dashboard/viewport-lock";
import { ScrollResetOnNavigate } from "@/components/dashboard/scroll-reset-on-navigate";

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Both of these are request-memoized (see lib/api.ts / lib/supabase/server.ts)
  // — every dashboard page that also calls them (directly, or via
  // requireSession/requireCapability) shares the exact same lookup instead
  // of each re-verifying the JWT and re-querying merchants from scratch.
  const [session, user] = await Promise.all([getSessionOrNull(), getAuthUser()]);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  const userInitial = user?.email ? user.email.charAt(0).toUpperCase() : "U";
  const merchant = session.merchant;

  return (
    // `fixed inset-0`, not an in-flow `h-[100dvh]` div: a fixed box with
    // both `top` and `bottom` set (which `inset-0` gives it) resolves its
    // own height from those offsets per the CSS box spec, so it always
    // exactly fills the real, current viewport — no `dvh` unit, no JS
    // height var, nothing to keep in sync frame-by-frame with the browser's
    // own chrome (address bar / keyboard) animation. That JS-sync fight was
    // the root cause behind every previous round of bugs here: because the
    // old shell stayed *in* normal document flow, whenever iOS Safari
    // scrolled the document out from under it (which its focus-triggered
    // auto-scroll-into-view does regardless of `overflow: hidden` — that
    // only blocks touch-drag scrolling), the whole shell — topbar and
    // bottom nav included — visibly moved with it. Taking the shell out of
    // flow entirely removes that failure mode structurally instead of
    // patching around it: see DashboardViewportLock for why <body> can't
    // meaningfully scroll anymore either.
    <div className="fixed inset-0 z-0 flex flex-col overflow-hidden bg-[var(--background)]">
      {/* Static overflow lock (belt-and-suspenders, not load-bearing — see
       * the component for why) on <html>/<body>. Mounted first so it's in
       * effect before anything below could theoretically trigger a scroll. */}
      <DashboardViewportLock />

      {/* Must commit before the layout-router nested inside <main> below —
       * see the component for why (`main` is the only real scroll
       * container left anywhere in this shell, so it's what Next's own
       * built-in scroll-and-focus restoration resolves scrollIntoView()
       * against on every route change; this resets it to the top first so
       * that restoration finds nothing to do). */}
      <ScrollResetOnNavigate />

      {/* Top bar — a normal flex child; the shell around it doesn't scroll,
       * so it doesn't need position:fixed/sticky of its own to stay put. */}
      <DashboardTopbar
        locale={locale}
        initial={userInitial}
        businessName={merchant?.business_name ?? null}
        logoUrl={merchant?.logo_url ?? null}
      />

      {/* Body below topbar — fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sticky sidebar (desktop only) — never scrolls */}
        <DashboardNav locale={locale} />

        {/* Scrollable main content — the only element in this whole shell
         * that scrolls at all. */}
        <main id="dashboard-main" className="flex-1 overflow-y-auto p-6 md:p-10 xl:p-12">
          {children}
        </main>
      </div>

      {/* Bottom tab bar (mobile only) — also just a normal flex sibling of
       * the row above, same reasoning as the top bar. On Android/Chromium,
       * the `interactiveWidget: "resizes-content"` viewport meta
       * (app/layout.tsx) shrinks the layout viewport itself for the
       * keyboard, so this rises above the keyboard for free, natively — no
       * JS. iOS never shrinks the layout viewport for the keyboard, so
       * there this bar simply sits behind the keyboard while it's open and
       * reappears the instant it closes, the same way it would in a native
       * app if you didn't go out of your way to float a toolbar above the
       * keyboard. That's a deliberate simplification, not an oversight: a
       * `visualViewport`-driven `position: fixed` + computed-offset bar
       * that follows the keyboard up on iOS is the fancier, more "correct"
       * pattern production apps often use, but it's also exactly the kind
       * of continuously-recalculated-on-every-event positioning that broke
       * down here before (rounds 2 and 4) — untestable on real iOS hardware
       * within this task, so the fewer moving parts the better. Revisit
       * this specific bar with that pattern, scoped to just this
       * component, if the CEO wants the nav to float above the keyboard on
       * iOS too. */}
      <DashboardMobileNav locale={locale} />
    </div>
  );
}
