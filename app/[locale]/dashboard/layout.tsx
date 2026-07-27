import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DashboardNav } from "@/components/dashboard/nav";
import { getSessionOrNull } from "@/lib/api";
import { getAuthUser } from "@/lib/supabase/server";

import { DashboardTopbar } from "@/components/dashboard/topbar";

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
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      {/* Fixed top bar */}
      <DashboardTopbar
        locale={locale}
        initial={userInitial}
        businessName={merchant?.business_name ?? null}
        logoUrl={merchant?.logo_url ?? null}
      />

      {/* Body below topbar — fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sticky sidebar (desktop) / bottom tab bar (mobile) — never scrolls */}
        <DashboardNav locale={locale} />

        {/* Scrollable main content — bottom padding on mobile clears the fixed tab bar */}
        <main id="dashboard-main" className="flex-1 overflow-y-auto p-6 pb-24 md:p-10 md:pb-10 xl:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}
