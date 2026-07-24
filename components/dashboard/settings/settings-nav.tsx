"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const SECTIONS = ["profile", "branding", "business", "locations", "team", "security", "notifications", "integrations", "data"] as const;
type Section = (typeof SECTIONS)[number];

export function SettingsNav({ locale }: { locale: string }) {
  const t = useTranslations("settings.nav");
  const tSettings = useTranslations("settings");
  const tNav = useTranslations("nav");
  const pathname = usePathname();

  const groups: { label?: string; sections: Section[] }[] = [
    { label: t("groups.business"), sections: ["business", "locations"] },
    { sections: ["branding"] },
    { sections: ["team"] },
    { sections: ["notifications"] },
    { sections: ["security"] },
    { sections: ["integrations"] },
    { label: t("groups.account"), sections: ["profile", "data"] },
  ];

  function isActive(section: Section) {
    const href = `/${locale}/dashboard/settings/${section}`;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <>
      {/* Mobile / tablet — compact single-row scroller, so the nav never pushes the
          actual settings fields below the fold. Flattened (no group labels) on purpose:
          there's no room for headers in a horizontal strip. */}
      <nav aria-label={tSettings("title")} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:hidden">
        {SECTIONS.map((section) => {
          const href = `/${locale}/dashboard/settings/${section}`;
          const active = isActive(section);
          return (
            <Link
              key={section}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
                active
                  ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)]"
                  : "border-[var(--line)] text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
              )}
            >
              {t(section)}
            </Link>
          );
        })}
        <Link
          href={`/${locale}/dashboard/billing`}
          className="shrink-0 rounded-full border border-[var(--line)] px-3.5 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
        >
          {tNav("billing")}
        </Link>
      </nav>

      {/* Desktop — grouped sidebar */}
      <nav aria-label={tSettings("title")} className="hidden lg:flex lg:w-56 lg:shrink-0 lg:flex-col lg:gap-5">
        {groups.map((group, i) => (
          <div key={i}>
            {group.label && (
              <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">{group.label}</p>
            )}
            <div className="flex flex-col gap-0.5">
              {group.sections.map((section) => {
                const href = `/${locale}/dashboard/settings/${section}`;
                const active = isActive(section);
                return (
                  <Link
                    key={section}
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      active
                        ? "bg-[var(--primary-soft)] text-[var(--primary)]"
                        : "text-[var(--muted)] hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
                    )}
                  >
                    {t(section)}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        <div className="border-t border-[var(--line)] pt-4">
          <Link
            href={`/${locale}/dashboard/billing`}
            className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[var(--muted)] transition-colors hover:bg-[var(--surface-2)] hover:text-[var(--ink)]"
          >
            {tNav("billing")}
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </nav>
    </>
  );
}
