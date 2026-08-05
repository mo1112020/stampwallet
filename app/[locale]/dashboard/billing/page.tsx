import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSessionOrNull } from "@/lib/api";
import { roleHasCapability } from "@/lib/auth/permissions";
import { getBillingUsage, getBillingInvoices, type BillingUsage } from "@/lib/billing/data";
import { PADDLE_PRICE_ENV, paddlePriceId, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";
import { getAuthUser } from "@/lib/supabase/server";
import { BillingContent } from "@/components/dashboard/billing-content";

const PAID_PLANS = Object.keys(PADDLE_PRICE_ENV) as PaidPlan[];
const INTERVALS = Object.keys(PADDLE_PRICE_ENV.starter) as PlanInterval[];

export default async function BillingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("billing");

  const session = await getSessionOrNull();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  if (!roleHasCapability(session.role, "billing")) {
    return (
      <div className="max-w-5xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">{t("noAccess")}</p>
      </div>
    );
  }

  let usage: BillingUsage | null = null;
  let usageFailed = false;
  try {
    usage = await getBillingUsage(session);
  } catch {
    usageFailed = true;
  }

  const invoices = await getBillingInvoices(session).catch(() => []);

  const priceIds = Object.fromEntries(
    PAID_PLANS.map((plan) => [plan, Object.fromEntries(INTERVALS.map((interval) => [interval, paddlePriceId(plan, interval) ?? null]))])
  ) as Record<PaidPlan, Record<PlanInterval, string | null>>;

  const user = await getAuthUser();

  return (
    <BillingContent
      merchant={session.merchant}
      usage={usage}
      usageFailed={usageFailed}
      invoices={invoices}
      priceIds={priceIds}
      customerEmail={user?.email ?? null}
    />
  );
}
