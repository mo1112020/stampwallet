"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buttonVariants } from "@/components/ui/button";
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
  const [interval, setInterval] = useState<PlanInterval>("monthly");

  // Base USD list price — the same figure Stripe Checkout charges (see
  // lib/billing/plans.ts). Actual tax/currency at checkout is computed by
  // Stripe itself once the customer enters their billing details there;
  // this is a static display price, not a live tax-inclusive preview.
  function priceFor(plan: PaidPlan) {
    if (!priceIds[plan][interval]) return undefined;
    return formatUsd(PLAN_PRICES_USD_CENTS[plan][interval]);
  }

  const plans: {
    key: "free" | PaidPlan;
    name: string;
    price: string | undefined;
    period: string;
    desc: string;
    cta: string;
    featured: boolean;
  }[] = [
    {
      key: "free",
      name: t("freeName"),
      price: t("freePrice"),
      period: "",
      desc: t("freeDesc"),
      cta: t("freeCta"),
      featured: true,
    },
    {
      key: "starter",
      name: t("starterName"),
      price: priceFor("starter"),
      period: `/${interval === "monthly" ? "mo" : interval === "quarterly" ? "qtr" : "yr"}`,
      desc: t("starterDesc"),
      cta: t("starterCta"),
      featured: false,
    },
    {
      key: "pro",
      name: t("proName"),
      price: priceFor("pro"),
      period: `/${interval === "monthly" ? "mo" : interval === "quarterly" ? "qtr" : "yr"}`,
      desc: t("proDesc"),
      cta: t("proCta"),
      featured: false,
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

      <StaggerGroup className="mx-auto mt-8 grid max-w-6xl gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <article
            key={plan.key}
            className={
              plan.featured
                ? "rounded-[24px] border-2 border-[var(--primary)] bg-[var(--surface)] p-8"
                : "rounded-[24px] border border-[var(--line)] bg-[var(--surface)] p-8"
            }
          >
            <h2 className="text-xl font-semibold">{plan.name}</h2>
            <p className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)]">
              {plan.price ?? "…"}
              {plan.price && plan.period && <span className="text-base font-medium text-[var(--muted)]">{plan.period}</span>}
            </p>
            <p className="mt-3 text-[var(--muted)]">{plan.desc}</p>
            <Link href={`/${locale}/signup`} className={buttonVariants({ className: "mt-8" })}>
              {plan.cta}
            </Link>
          </article>
        ))}
      </StaggerGroup>
    </>
  );
}
