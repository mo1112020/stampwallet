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

  // Example user data extraction. You'd normally fetch the user's name from a profiles table.
  const userInitial = user.email ? user.email.charAt(0).toUpperCase() : "U";

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[var(--background)]">
      {/* Fixed top bar */}
      <DashboardTopbar locale={locale} initial={userInitial} />

      {/* Body below topbar — fills remaining height */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sticky sidebar — never scrolls */}
        <DashboardNav locale={locale} />

        {/* Scrollable main content */}
        <main className="flex-1 overflow-y-auto p-6 md:p-10 xl:p-12">
          {children}
        </main>
      </div>
    </div>
  );
}
