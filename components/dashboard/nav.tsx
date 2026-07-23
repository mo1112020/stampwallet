"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { dashboardNavLinks } from "@/lib/nav-links";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOBILE_PRIMARY_COUNT = 4;

export function DashboardNav({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const primaryLinks = dashboardNavLinks.slice(0, MOBILE_PRIMARY_COUNT);
  const overflowLinks = dashboardNavLinks.slice(MOBILE_PRIMARY_COUNT);
  const overflowActive = overflowLinks.some((link) => {
    const href = `/${locale}/${link.href}`;
    return pathname === href || pathname.startsWith(`${href}/`);
  });

  return (
    <>
      {/* Desktop / tablet — icon rail, sticky for the full body height */}
      <aside className="relative hidden w-16 shrink-0 flex-col items-center border-e border-[var(--line)] bg-[var(--surface)] py-6 md:flex">
        <nav className="flex flex-col gap-2">
          {dashboardNavLinks.map((link) => {
            const href = `/${locale}/${link.href}`;
            const active = pathname === href || pathname.startsWith(`${href}/`);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={href}
                title={t(link.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  active
                    ? "bg-[var(--ink)] text-[var(--surface)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                )}
              >
                {active && (
                  <span className="absolute start-[-13px] h-5 w-0.5 rounded-full bg-[var(--primary)]" />
                )}
                <Icon className="h-5 w-5" strokeWidth={1.75} />
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile — bottom tab bar: primary destinations + a "More" overflow for the rest */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-around border-t border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label={t("dashboard")}
      >
        {primaryLinks.map((link) => {
          const href = `/${locale}/${link.href}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                active ? "text-[var(--primary)]" : "text-[var(--muted)]"
              )}
            >
              <Icon className="h-5 w-5" strokeWidth={active ? 2 : 1.75} />
              {t(link.key)}
            </Link>
          );
        })}
        {overflowLinks.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors",
                  overflowActive ? "text-[var(--primary)]" : "text-[var(--muted)]"
                )}
              >
                <MoreHorizontal className="h-5 w-5" strokeWidth={overflowActive ? 2 : 1.75} />
                {t("more")}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" sideOffset={12}>
              {overflowLinks.map((link) => {
                const href = `/${locale}/${link.href}`;
                const Icon = link.icon;
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link href={href} className="w-full">
                      <Icon className="h-4 w-4 text-[var(--muted)]" strokeWidth={1.75} />
                      {t(link.key)}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </nav>
    </>
  );
}
