import { headers } from "next/headers";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { PADDLE_PRICE_ENV, paddlePriceId, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";

const PAID_PLANS = Object.keys(PADDLE_PRICE_ENV) as PaidPlan[];
const INTERVALS = Object.keys(PADDLE_PRICE_ENV.starter) as PlanInterval[];

export default async function PricingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("site.pricing");

  const priceIds = Object.fromEntries(
    PAID_PLANS.map((plan) => [plan, Object.fromEntries(INTERVALS.map((interval) => [interval, paddlePriceId(plan, interval) ?? null]))])
  ) as Record<PaidPlan, Record<PlanInterval, string | null>>;

  // Vercel sets this from the visitor's IP; absent locally/off-Vercel, in
  // which case PricePreview() infers location from the request IP itself —
  // never pass a sentinel like "unknown" through as a country code.
  const country = (await headers()).get("x-vercel-ip-country");

  return (
    <main>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <section className="px-6 py-20">
        <PricingPlans locale={locale} country={country} priceIds={priceIds} />
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[var(--muted)]">{t("note")}</p>
      </section>
    </main>
  );
}
