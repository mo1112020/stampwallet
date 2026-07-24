"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { useGSAP } from "@gsap/react";
import { MoreHorizontal } from "lucide-react";
import { gsap } from "@/lib/motion/gsap";
import { useReducedMotion } from "@/lib/motion/use-reduced-motion";
import { cn } from "@/lib/utils";
import { dashboardNavLinks } from "@/lib/nav-links";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOBILE_PRIMARY_COUNT = 4;

/**
 * "dashboard" (the Home link) is a string-prefix of every other dashboard route
 * (e.g. "dashboard/programs"), so it needs an exact match — everything else keeps
 * prefix matching so nested routes (e.g. "dashboard/programs/123") stay highlighted.
 */
function isLinkActive(pathname: string, href: string, linkHref: string) {
  if (linkHref === "dashboard") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function DashboardNav({ locale }: { locale: string }) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const primaryLinks = dashboardNavLinks.slice(0, MOBILE_PRIMARY_COUNT);
  const overflowLinks = dashboardNavLinks.slice(MOBILE_PRIMARY_COUNT);
  const overflowActive = overflowLinks.some((link) => {
    const href = `/${locale}/${link.href}`;
    return isLinkActive(pathname, href, link.href);
  });

  const railRef = useRef<HTMLElement>(null);
  const indicatorRef = useRef<HTMLSpanElement>(null);
  const itemRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const hasPositionedRef = useRef(false);
  const reduced = useReducedMotion();

  const activeHref = dashboardNavLinks.find((link) => {
    const href = `/${locale}/${link.href}`;
    return isLinkActive(pathname, href, link.href);
  })?.href;

  useGSAP(
    () => {
      const rail = railRef.current;
      const indicator = indicatorRef.current;
      const activeEl = activeHref ? itemRefs.current.get(activeHref) : undefined;
      if (!rail || !indicator || !activeEl) return;

      const railRect = rail.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      const top = itemRect.top - railRect.top;

      if (reduced || !hasPositionedRef.current) {
        gsap.set(indicator, { y: top, height: itemRect.height, opacity: 1 });
        hasPositionedRef.current = true;
        return;
      }

      gsap.to(indicator, {
        y: top,
        height: itemRect.height,
        duration: 0.45,
        ease: "power3.out",
      });
    },
    { dependencies: [activeHref, reduced], scope: railRef }
  );

  return (
    <>
      {/* Desktop / tablet — icon rail, sticky for the full body height */}
      <aside className="relative hidden w-16 shrink-0 flex-col items-center border-e border-[var(--line)] bg-[var(--surface)] py-6 md:flex">
        <nav ref={railRef} className="relative flex flex-col gap-2">
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className="pointer-events-none absolute start-[-13px] top-0 w-0.5 rounded-full bg-[var(--primary)] opacity-0"
          />
          {dashboardNavLinks.map((link) => {
            const href = `/${locale}/${link.href}`;
            const active = isLinkActive(pathname, href, link.href);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={href}
                ref={(el) => {
                  if (el) itemRefs.current.set(link.href, el);
                  else itemRefs.current.delete(link.href);
                }}
                aria-label={t(link.key)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group relative flex h-10 w-10 items-center justify-center rounded-xl transition-colors duration-200",
                  "hover:scale-[1.06] active:scale-95",
                  "motion-reduce:hover:scale-100 motion-reduce:active:scale-100",
                  "[transition-property:background-color,color,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]",
                  active
                    ? "bg-[var(--ink)] text-[var(--surface)]"
                    : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                <span
                  role="tooltip"
                  aria-hidden="true"
                  className="pointer-events-none absolute start-full ms-3 whitespace-nowrap rounded-lg bg-[var(--ink)] px-2.5 py-1.5 text-[12px] font-medium text-[var(--surface)] opacity-0 shadow-lg transition-[opacity,transform] duration-150 [transform:translateX(-4px)] rtl:[transform:translateX(4px)] group-hover:opacity-100 group-hover:[transform:translateX(0)] group-focus-visible:opacity-100 group-focus-visible:[transform:translateX(0)]"
                >
                  {t(link.key)}
                </span>
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
          const active = isLinkActive(pathname, href, link.href);
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors active:scale-95 [transition-property:color,transform] duration-150",
                active ? "text-[var(--primary)]" : "text-[var(--muted)]"
              )}
            >
              <Icon
                className={cn("h-5 w-5 transition-transform duration-200", active && "scale-110")}
                strokeWidth={active ? 2 : 1.75}
              />
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
                  "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors active:scale-95 [transition-property:color,transform] duration-150",
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
