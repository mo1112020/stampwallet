"use client";

import Link from "next/link";
import { useIsAuthenticated } from "@/lib/supabase/use-is-authenticated";

/**
 * The footer's "Company" column has a single signup CTA
 * (site.footer.start, "Start now"). Showing that to an already-logged-in
 * visitor is the same class of bug as the header's Login/Sign up links
 * (see components/marketing/header.tsx) -- so this swaps it for a
 * Dashboard link once the client-side session check resolves. Isolated
 * into its own client component so the rest of MarketingFooter can stay a
 * plain server component (it only needs next-intl/server translations,
 * nothing user-specific).
 */
export function FooterCtaLink({
  locale,
  startLabel,
  dashboardLabel,
}: {
  locale: string;
  startLabel: string;
  dashboardLabel: string;
}) {
  const isAuthenticated = useIsAuthenticated();

  return (
    <Link href={isAuthenticated ? `/${locale}/dashboard` : `/${locale}/signup`} className="hover:text-[var(--ink)]">
      {isAuthenticated ? dashboardLabel : startLabel}
    </Link>
  );
}
