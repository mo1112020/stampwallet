"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Pencil, Sparkles, Star } from "lucide-react";
import { CreativePricing, type PricingTier } from "@/components/ui/creative-pricing";
import { cn } from "@/lib/utils";
import { PLAN_PRICES_USD_CENTS, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";

const INTERVALS: { value: PlanInterval; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

function formatUsd(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

export function PricingPlans({
  locale,
  priceIds,
}: {
  locale: string;
  priceIds: Record<PaidPlan, Record<PlanInterval, string | null>>;
}) {
  const t = useTranslations("site.pricing");
  const [interval, setInterval] = useState<PlanInterval>("quarterly");

  // Base USD list price — the same figure Stripe Checkout charges (see
  // lib/billing/plans.ts). Actual tax/currency at checkout is computed by
  // Stripe itself once the customer enters their billing details there;
  // this is a static display price, not a live tax-inclusive preview.
  function priceFor(plan: PaidPlan) {
    if (!priceIds[plan][interval]) return undefined;
    return formatUsd(PLAN_PRICES_USD_CENTS[plan][interval]);
  }

  const periodLabel = `/${interval === "monthly" ? "mo" : interval === "quarterly" ? "qtr" : "yr"}`;
  const signupHref = `/${locale}/signup`;

  const tiers: PricingTier[] = [
    {
      name: t("freeName"),
      icon: <Sparkles className="w-6 h-6" />,
      price: t("freePrice"),
      description: t("freeDesc"),
      cta: t("freeCta"),
      href: signupHref,
      features: ["1 active program", "Up to 100 customers", "Apple & Google Wallet passes"],
    },
    {
      name: t("starterName"),
      icon: <Pencil className="w-6 h-6" />,
      price: priceFor("starter") ?? "…",
      period: priceIds.starter[interval] ? periodLabel : undefined,
      description: t("starterDesc"),
      cta: t("starterCta"),
      href: signupHref,
      features: ["3 active programs", "1,000 customers", "Custom branding", "Card expiration"],
    },
    {
      name: t("proName"),
      icon: <Star className="w-6 h-6" />,
      price: priceFor("pro") ?? "…",
      period: priceIds.pro[interval] ? periodLabel : undefined,
      description: t("proDesc"),
      cta: t("proCta"),
      href: signupHref,
      popular: true,
      features: ["20 active programs", "10,000 customers", "Custom branding", "Card expiration"],
    },
  ];

  return (
    <>
      <div className="mx-auto flex max-w-6xl justify-center">
        <div className="inline-flex rounded-full border border-[var(--line)] p-1">
          {INTERVALS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setInterval(value)}
              className={cn(
                "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                interval === value ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <CreativePricing tag={t("eyebrow")} title={t("title")} description={t("description")} tiers={tiers} />
      </div>
    </>
  );
}
