import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { PricingComparisonTable } from "@/components/marketing/pricing-comparison-table";
import {
  STRIPE_PRICE_ENV,
  stripePriceId,
  PLAN_PRICES_USD_CENTS,
  type PaidPlan,
  type PlanInterval,
} from "@/lib/billing/plans";
import { buildPageMetadata } from "@/lib/seo/metadata";

const PAID_PLANS = Object.keys(STRIPE_PRICE_ENV) as PaidPlan[];
const INTERVALS = Object.keys(STRIPE_PRICE_ENV.starter) as PlanInterval[];

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "site.pricing" });
  return buildPageMetadata({ locale, path: "pricing", title: t("title"), description: t("description") });
}

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.pricing");

  const priceIds = Object.fromEntries(
    PAID_PLANS.map((plan) => [plan, Object.fromEntries(INTERVALS.map((interval) => [interval, stripePriceId(plan, interval) ?? null]))])
  ) as Record<PaidPlan, Record<PlanInterval, string | null>>;

  // Product/Offer structured data — one Offer per plan, priced straight
  // from PLAN_PRICES_USD_CENTS (the same constants Stripe Checkout charges,
  // see lib/billing/plans.ts) so this can't quietly drift from real pricing.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "WalletOS",
    description: t("description"),
    offers: [
      { "@type": "Offer", name: t("freeName"), price: "0", priceCurrency: "USD" },
      ...PAID_PLANS.map((plan) => ({
        "@type": "Offer",
        name: t(`${plan}Name`),
        price: (PLAN_PRICES_USD_CENTS[plan].monthly / 100).toFixed(2),
        priceCurrency: "USD",
        billingDuration: "P1M",
      })),
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      <section className="px-6 pb-16 pt-32 md:pb-24 md:pt-36">
        <PricingPlans locale={locale} priceIds={priceIds} />
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[var(--muted)]">{t("note")}</p>
        <PricingComparisonTable t={t} />
      </section>
    </main>
  );
}
