"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const links = [
  { href: "dashboard", key: "dashboard" },
  { href: "dashboard/programs", key: "programs" },
  { href: "dashboard/analytics", key: "analytics" },
  { href: "dashboard/billing", key: "billing" },
  { href: "dashboard/settings", key: "settings" },
] as const;

export function DashboardNav({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push(`/${locale}/login`);
    router.refresh();
  }

  return (
    <aside className="flex w-full flex-col gap-6 border-b border-[var(--line)] bg-white p-5 md:min-h-screen md:w-60 md:border-b-0 md:border-e">
      <Link href={`/${locale}/dashboard`} className="font-brand text-lg text-[var(--ink)]">
        StampWallet
      </Link>
      <nav className="flex flex-wrap gap-1 md:flex-col">
        {links.map((link) => {
          const href = `/${locale}/${link.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={link.href}
              href={href}
              className={cn(
                "rounded-full px-3 py-2 text-sm",
                active
                  ? "bg-[var(--primary)] font-medium text-white"
                  : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              )}
            >
              {t(link.key)}
            </Link>
          );
        })}
      </nav>
      <button
        type="button"
        onClick={logout}
        className="mt-auto text-start text-sm text-[var(--muted)] hover:text-[var(--ink)]"
      >
        {t("logout")}
      </button>
    </aside>
  );
}
