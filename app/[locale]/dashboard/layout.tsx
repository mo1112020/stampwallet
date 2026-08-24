import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DashboardNav, DashboardMobileNav } from "@/components/dashboard/nav";
import { getSessionOrNull } from "@/lib/api";
import { getAuthUser } from "@/lib/supabase/server";

import { DashboardTopbar } from "@/components/dashboard/topbar";
import { DashboardViewportHeightFix } from "@/components/dashboard/viewport-height-fix";
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
    // 100dvh, not h-screen/100vh: on mobile, 100vh is the viewport height
    // with the browser's URL bar *hidden*, so while that bar is showing the
    // layout is taller than what's actually visible — and it resizes as the
    // bar collapses/expands during scroll, which made this whole fixed
    // shell (topbar included) visibly shift out of place. dvh tracks the
    // real visible viewport instead. Same unit the marketing hero already
    // uses for the same reason.
    <div
      className="flex h-[100dvh] flex-col overflow-hidden bg-[var(--background)] motion-safe:transition-[height] motion-safe:duration-150 motion-safe:ease-out"
      style={{ height: "var(--app-dvh, 100dvh)" }}
    >
      {/* Tracks window.visualViewport so the shell's height stays correct on
       * iOS Safari, where the on-screen keyboard shrinks the visible area
       * without shrinking the CSS layout viewport dvh is computed from (see
       * the component for why). The height transition above (motion-safe,
       * so prefers-reduced-motion still gets an instant snap) exists because
       * --app-dvh updates from a JS event handler, never perfectly in sync
       * with the frame the browser's own chrome (keyboard/address bar)
       * animates on — a late correction settles instead of visibly popping. */}
      <DashboardViewportHeightFix />

      {/* Must commit before the layout-router nested inside <main> below —
       * see the component for why (it prevents Next's own built-in
       * scroll-and-focus restoration from fighting this shell on every
       * navigation, which is what was nudging the bottom nav on route
       * changes). */}
      <ScrollResetOnNavigate />

      {/* Fixed top bar */}
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

        {/* Scrollable main content */}
        <main id="dashboard-main" className="flex-1 overflow-y-auto p-6 md:p-10 xl:p-12">
          {children}
        </main>
      </div>

      {/* Bottom tab bar (mobile only) — a normal flex sibling of the row
       * above, not position:fixed, so it can't drift out of sync with the
       * browser's own viewport math (see DashboardMobileNav for why). */}
      <DashboardMobileNav locale={locale} />
    </div>
  );
}
