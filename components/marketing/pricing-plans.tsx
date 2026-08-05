"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { initializePaddle, type Paddle, type PricePreviewParams } from "@paddle/paddle-js";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { PaidPlan, PlanInterval } from "@/lib/billing/plans";

const INTERVALS: { value: PlanInterval; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "yearly", label: "Yearly" },
];

/** priceId -> Paddle's already-formatted, locale/tax-correct total string
 * (e.g. "$29.00", "€26.60"). Never reformatted or math'd on — see
 * pricing-pages skill: Paddle's PricePreview is the source of truth for
 * what checkout will actually charge. */
type FormattedPrices = Record<string, string>;

export function PricingPlans({
  locale,
  country,
  priceIds,
}: {
  locale: string;
  country: string | null;
  priceIds: Record<PaidPlan, Record<PlanInterval, string | null>>;
}) {
  const t = useTranslations("site.pricing");
  const [paddle, setPaddle] = useState<Paddle | null>(null);
  const [prices, setPrices] = useState<FormattedPrices>({});
  const [interval, setInterval] = useState<PlanInterval>("monthly");

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
    const env = process.env.NEXT_PUBLIC_PADDLE_ENV;
    if (!token || !env) {
      // Fail loudly (console, not a thrown error — this is a public
      // marketing page and a hard crash is worse UX than falling back to
      // the static translated price strings below).
      console.error("Paddle is not configured — NEXT_PUBLIC_PADDLE_CLIENT_TOKEN / NEXT_PUBLIC_PADDLE_ENV missing");
      return;
    }
    initializePaddle({ token, environment: env as "sandbox" | "production" }).then((p) => p && setPaddle(p));
  }, []);

  useEffect(() => {
    if (!paddle) return;
    const items: PricePreviewParams["items"] = (Object.keys(priceIds) as PaidPlan[]).flatMap((plan) =>
      (Object.keys(priceIds[plan]) as PlanInterval[])
        .map((iv) => priceIds[plan][iv])
        .filter((id): id is string => Boolean(id))
        .map((priceId) => ({ priceId, quantity: 1 }))
    );
    if (items.length === 0) return;

    paddle
      .PricePreview({
        items,
        // 'country' is null when there's no geo header to read (see
        // page.tsx) — omitting `address` lets Paddle infer location from
        // the visitor's IP instead.
        ...(country && { address: { countryCode: country } }),
      })
      .then((response) => {
        const next: FormattedPrices = {};
        for (const item of response.data.details.lineItems) {
          next[item.price.id] = item.formattedTotals.total;
        }
        setPrices(next);
      })
      .catch((err) => console.error("Paddle PricePreview failed:", err));
  }, [paddle, country, priceIds]);

  function priceFor(plan: PaidPlan) {
    const priceId = priceIds[plan][interval];
    return priceId ? prices[priceId] : undefined;
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
