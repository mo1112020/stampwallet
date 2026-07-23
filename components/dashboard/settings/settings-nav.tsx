"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

const SECTIONS = [
  "profile",
  "branding",
  "business",
  "locations",
  "team",
  "security",
  "notifications",
  "integrations",
  "data",
] as const;

export function SettingsNav({ locale }: { locale: string }) {
  const t = useTranslations("settings.nav");
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto border-b border-[var(--line)] pb-px">
      {SECTIONS.map((section) => {
        const href = `/${locale}/dashboard/settings/${section}`;
        const active = pathname.startsWith(href);
        return (
          <Link
            key={section}
            href={href}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium",
              active
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "border-transparent text-[var(--muted)] hover:text-[var(--ink)]"
            )}
          >
            {t(section)}
          </Link>
        );
      })}
    </nav>
  );
}
