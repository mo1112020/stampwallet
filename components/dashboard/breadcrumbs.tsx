"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Route segments that map to a translated label. Anything not in this list
// (program/customer/notification IDs) is treated as a dynamic id and skipped
// entirely — an ID isn't a human-readable breadcrumb, so we don't fabricate one.
const KNOWN_SEGMENTS = new Set([
  "dashboard",
  "programs",
  "scan",
  "analytics",
  "notifications",
  "billing",
  "settings",
  "profile",
  "branding",
  "business",
  "locations",
  "team",
  "security",
  "integrations",
  "data",
  "customers",
  "templates",
  "onboarding",
  "new",
]);

export function Breadcrumbs({ locale }: { locale: string }) {
  const t = useTranslations("breadcrumbs");
  const pathname = usePathname();

  const afterLocale = pathname.replace(`/${locale}`, "");
  const segments = afterLocale.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  let hrefAccum = `/${locale}`;
  const crumbs = segments.flatMap((segment) => {
    hrefAccum += `/${segment}`;
    if (!KNOWN_SEGMENTS.has(segment)) return [];
    return [{ href: hrefAccum, label: t(segment) }];
  });

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="hidden items-center gap-1.5 text-[13px] lg:flex">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={crumb.href} className="flex items-center gap-1.5">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5 text-[var(--muted)] rtl:rotate-180" />}
            {isLast ? (
              <span className="font-medium text-[var(--ink)]">{crumb.label}</span>
            ) : (
              <Link
                href={crumb.href}
                className={cn("text-[var(--muted)] transition-colors hover:text-[var(--ink)]")}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
