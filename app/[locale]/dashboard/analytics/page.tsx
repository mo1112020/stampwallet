import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSessionOrNull } from "@/lib/api";
import { roleHasCapability } from "@/lib/auth/permissions";
import {
  getAnalyticsOverview,
  getRecentActivity,
  getScansTrend,
  resolveDateRange,
} from "@/lib/analytics/queries";
import { AnalyticsFilters } from "@/components/dashboard/analytics/filters";
import { KpiGrid } from "@/components/dashboard/analytics/kpi-grid";
import { TrendChart } from "@/components/dashboard/analytics/trend-chart";
import { ActivityFeed } from "@/components/dashboard/analytics/activity-feed";

export default async function AnalyticsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ from?: string; to?: string; program_id?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("analytics");

  const session = await getSessionOrNull();
  if (!session) {
    redirect(`/${locale}/login`);
  }

  if (!roleHasCapability(session.role, "view_analytics")) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm text-[var(--muted)]">{t("noAccess")}</p>
      </div>
    );
  }

  const sp = await searchParams;
  const range = resolveDateRange(sp);
  const filters = { ...range, programId: sp.program_id };

  const { data: programs } = await session.supabase
    .from("loyalty_programs")
    .select("id, name")
    .eq("merchant_id", session.merchantId)
    .order("name");

  const [overview, trend, activity] = await Promise.all([
    getAnalyticsOverview(session.supabase, session.merchant, filters),
    getScansTrend(session.supabase, session.merchant, filters),
    getRecentActivity(session.supabase, session.merchant, { programId: sp.program_id }),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
          {t("title")}
        </h1>
        <AnalyticsFilters programs={programs ?? []} />
      </div>

      <div className="mt-8">
        <KpiGrid overview={overview} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <TrendChart data={trend} />
        </div>
        <div>
          <ActivityFeed entries={activity} />
        </div>
      </div>
    </div>
  );
}
