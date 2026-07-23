"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Home, Smartphone, Users, QrCode, Route, Bell, Settings } from "lucide-react";

const links = [
  { href: "dashboard", key: "dashboard", icon: Home },
  { href: "dashboard/programs", key: "programs", icon: Smartphone },
  { href: "dashboard/scan", key: "scan", icon: QrCode },
  { href: "dashboard/analytics", key: "analytics", icon: Users },
  { href: "dashboard/notifications", key: "notifications", icon: Bell },
  { href: "dashboard/billing", key: "billing", icon: Route },
  { href: "dashboard/settings", key: "settings", icon: Settings },
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
    <aside className="relative flex w-16 shrink-0 flex-col items-center border-r border-[#e5e5e5] bg-white py-6">
      <nav className="flex flex-col gap-4">
        {links.map((link) => {
          const href = `/${locale}/${link.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={href}
              title={t(link.key)}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
                active
                  ? "bg-[#2b2b2b] text-white"
                  : "text-gray-400 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-5 w-5" />
            </Link>
          );
        })}
      </nav>

      <button
        type="button"
        onClick={logout}
        title={t("logout")}
        className="mt-auto flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900 transition-colors"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
          />
        </svg>
      </button>
    </aside>
  );
}
