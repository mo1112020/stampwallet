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

  // SoftwareApplication, not Product — WalletOS is a web-based subscription,
  // not shippable merchandise. Product/Offer previously here made Google's
  // rich-result checker evaluate it against Merchant Listing criteria built
  // for physical goods (shippingDetails, hasMerchantReturnPolicy, GTIN),
  // none of which apply and none of which we can honestly fill in. Offers
  // are priced straight from PLAN_PRICES_USD_CENTS (the same constants
  // Stripe Checkout charges, see lib/billing/plans.ts) so this can't
  // quietly drift from real pricing. No aggregateRating/review — none
  // exist yet, and Google requires one for the Software App rich result,
  // so this intentionally isn't rich-result-eligible until a real one does.
  const softwareAppJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "WalletOS",
    description: t("description"),
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: [
      { "@type": "Offer", name: t("freeName"), price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      ...PAID_PLANS.map((plan) => ({
        "@type": "Offer",
        name: t(`${plan}Name`),
        price: (PLAN_PRICES_USD_CENTS[plan].monthly / 100).toFixed(2),
        priceCurrency: "USD",
        billingDuration: "P1M",
        availability: "https://schema.org/InStock",
      })),
    ],
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppJsonLd) }} />
      <section className="px-6 pb-16 pt-32 md:pb-24 md:pt-36">
        <PricingPlans locale={locale} priceIds={priceIds} />
        {/* Self-contained, quotable plan-limits sentence — the per-tier card
            copy above is deliberately short for layout, so it has nothing an
            LLM can lift verbatim to answer "what does the Free plan include". */}
        <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-[var(--ink)]">{t("atAGlance")}</p>
        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-[var(--muted)]">{t("note")}</p>
        <PricingComparisonTable t={t} />
      </section>
    </main>
  );
}
