import { redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { DashboardNav } from "@/components/dashboard/nav";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/login`);
  }

  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";
  const { data: merchant } = await supabase
    .from("merchants")
    .select("business_name, logo_url")
    .eq("id", user.id)
    .maybeSingle();

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
