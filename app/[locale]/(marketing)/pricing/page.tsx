import { getTranslations, setRequestLocale } from "next-intl/server";
import { PageHero } from "@/components/marketing/page-hero";
import { PricingPlans } from "@/components/marketing/pricing-plans";
import { STRIPE_PRICE_ENV, stripePriceId, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";

const PAID_PLANS = Object.keys(STRIPE_PRICE_ENV) as PaidPlan[];
const INTERVALS = Object.keys(STRIPE_PRICE_ENV.starter) as PlanInterval[];

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

  return (
    <main>
      <PageHero eyebrow={t("eyebrow")} title={t("title")} description={t("description")} />
      <section className="px-6 py-20">
        <PricingPlans locale={locale} priceIds={priceIds} />
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-[var(--muted)]">{t("note")}</p>
      </section>
    </main>
  );
}
