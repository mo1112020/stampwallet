import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PlusCircle, QrCode, BarChart3, Settings2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { getSessionOrNull } from "@/lib/api";
import { resolveDateRange, type AnalyticsOverview } from "@/lib/analytics/queries";
import { getDashboardData } from "@/lib/analytics/dashboard";
import { ActivityFeed } from "@/components/dashboard/analytics/activity-feed";
import { EmptyPhoneMockup } from "@/components/dashboard/phone-mockup";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { cn } from "@/lib/utils";

const CAMPAIGN_STATUS_VARIANT: Record<string, "success" | "primary" | "default" | "warning"> = {
  sent: "success",
  sending: "primary",
  scheduled: "primary",
  canceled: "warning",
};

function Delta({ current, previous, t }: { current: number; previous: number; t: Awaited<ReturnType<typeof getTranslations>> }) {
  if (previous === 0 && current === 0) return null;
  const diff = current - previous;
  if (diff === 0) return <span className="text-xs font-medium text-[var(--muted)]">{t("noChange")}</span>;
  const up = diff > 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 text-xs font-semibold",
        up ? "text-[var(--success)]" : "text-[var(--danger)]"
      )}
    >
      {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {t("vsPrior30d", { diff: Math.abs(diff).toLocaleString() })}
    </span>
  );
}

function StatTile({
  label,
  value,
  delta,
  extra,
}: {
  label: string;
  value: string;
  delta?: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-[var(--ink)]">{value}</p>
      <div className="mt-2 flex min-h-[18px] items-center gap-2">
        {delta}
        {extra}
      </div>
    </Card>
  );
}

function redemptionRate(overview: AnalyticsOverview) {
  if (overview.totalScans === 0) return 0;
  return Math.round((overview.rewardsRedeemed / overview.totalScans) * 1000) / 10;
}

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const tNav = await getTranslations("nav");

  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);
  const { merchant, supabase } = session;

  if (!merchant.onboarding_completed) {
    redirect(`/${locale}/dashboard/onboarding`);
  }

  const currentRange = resolveDateRange({});
  const spanMs = new Date(currentRange.to).getTime() - new Date(currentRange.from).getTime();
  const previousRange = {
    from: new Date(new Date(currentRange.from).getTime() - spanMs).toISOString(),
    to: currentRange.from,
  };

  // Programs + campaigns + current/previous overview + recent activity in ONE
  // Supabase round trip (public.dashboard_overview RPC), instead of the ~8
  // separate calls this render used to make. See lib/analytics/dashboard.ts.
  const { programs, campaigns, overview, previousOverview, activity } = await getDashboardData(
    supabase,
    merchant,
    currentRange,
    previousRange
  );

  const hasPrograms = programs.length > 0;
  const activeProgramCount = programs.filter((p) => p.is_active).length;

  return (
    <div className="mx-auto max-w-6xl">
      <Reveal as="div" className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
            {t("welcome")}
            <span className="text-[var(--primary)]">
              {merchant.business_name ? `, ${merchant.business_name}` : ""}
            </span>
          </h1>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {t("planLabel")}: <span className="font-medium capitalize text-[var(--ink)]">{merchant.plan}</span>
            {hasPrograms && overview.totalScans > 0 && (
              <>
                {" · "}
                {t("conversionRate", { pct: redemptionRate(overview) })}
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/dashboard/templates`}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-sm transition-[opacity,transform] duration-150 hover:opacity-95 active:scale-[0.98]"
          >
            <PlusCircle className="h-4 w-4" /> {t("createProgram")}
          </Link>
          <Link
            href={`/${locale}/dashboard/scan`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] transition-[background-color,transform] duration-150 hover:bg-[var(--surface-2)] active:scale-[0.98]"
          >
            <QrCode className="h-4 w-4" /> {t("scan")}
          </Link>
          <Link
            href={`/${locale}/dashboard/analytics`}
            className="inline-flex h-10 items-center gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 text-sm font-semibold text-[var(--ink)] transition-[background-color,transform] duration-150 hover:bg-[var(--surface-2)] active:scale-[0.98]"
          >
            <BarChart3 className="h-4 w-4" /> {tNav("analytics")}
          </Link>
          <Link
            href={`/${locale}/dashboard/settings`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition-[background-color,transform] duration-150 hover:bg-[var(--surface-2)] active:scale-[0.98]"
            aria-label={tNav("settings")}
          >
            <Settings2 className="h-4 w-4" />
          </Link>
        </div>
      </Reveal>

      {hasPrograms ? (
        <>
          {/* Command-center KPI row */}
          <StaggerGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatTile label={t("statActivePrograms")} value={`${activeProgramCount} / ${programs.length}`} />
            <StatTile
              label={t("statWalletInstalls")}
              value={overview.totalCards.toLocaleString()}
              delta={<Delta current={overview.totalCards} previous={previousOverview.totalCards} t={t} />}
              extra={
                <span className="flex items-center gap-1.5 opacity-80">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/Apple_Wallet_icon.svg" alt="" className="h-4 w-auto" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/Google_Wallet_icon.svg" alt="" className="h-4 w-auto" />
                </span>
              }
            />
            <StatTile
              label={t("statRecentScans")}
              value={overview.totalScans.toLocaleString()}
              delta={<Delta current={overview.totalScans} previous={previousOverview.totalScans} t={t} />}
            />
            <StatTile
              label={t("statRedemptionRate")}
              value={`${redemptionRate(overview)}%`}
              delta={<Delta current={overview.rewardsRedeemed} previous={previousOverview.rewardsRedeemed} t={t} />}
            />
            <StatTile
              label={t("statCustomers")}
              value={overview.totalCustomers.toLocaleString()}
              delta={<Delta current={overview.totalCustomers} previous={previousOverview.totalCustomers} t={t} />}
            />
            <StatTile
              label={t("statActiveCustomers")}
              value={overview.activeCustomers.toLocaleString()}
              delta={<Delta current={overview.activeCustomers} previous={previousOverview.activeCustomers} t={t} />}
            />
            {overview.revenueImpact !== null ? (
              <StatTile
                label={t("statRevenueImpact")}
                value={new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: overview.currency ?? "USD",
                  maximumFractionDigits: 0,
                }).format(overview.revenueImpact)}
                delta={<Delta current={overview.revenueImpact} previous={previousOverview.revenueImpact ?? 0} t={t} />}
              />
            ) : (
              <Card className="flex flex-col justify-between p-5">
                <p className="text-sm text-[var(--muted)]">{t("statRevenueImpact")}</p>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  {t.rich("revenueImpactHint", {
                    link: (chunks) => (
                      <Link href={`/${locale}/dashboard/settings/business`} className="font-medium text-[var(--primary)] hover:underline">
                        {chunks}
                      </Link>
                    ),
                  })}
                </p>
              </Card>
            )}
            <StatTile label={t("statRepeatVisits")} value={overview.repeatVisits.toLocaleString()} />
          </StaggerGroup>

          {/* Activity + notifications */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ActivityFeed entries={activity} />
            </div>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[var(--ink)]">{t("recentNotifications")}</p>
                <Link href={`/${locale}/dashboard/notifications`} className="text-xs font-medium text-[var(--primary)] hover:underline">
                  {t("viewAll")}
                </Link>
              </div>
              {!campaigns?.length ? (
                <p className="mt-3 text-sm text-[var(--muted)]">{t("noCampaignsSentYet")}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {campaigns.map((c) => (
                    <li key={c.id} className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] px-3 py-2.5 text-sm">
                      <span className="truncate text-[var(--ink)]">{c.title}</span>
                      <Badge variant={CAMPAIGN_STATUS_VARIANT[c.status] ?? "default"} className="shrink-0 capitalize">
                        {c.status}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* Program list — condensed, links out to the full Programs page for management */}
          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">{t("yourPrograms")}</h2>
              <Link href={`/${locale}/dashboard/programs`} className="text-sm font-semibold text-[var(--primary)] hover:underline">
                {t("manageAll")} →
              </Link>
            </div>
            <Card className="divide-y divide-[var(--line)] p-0">
              {programs.slice(0, 6).map((program) => {
                const config = program.config as any;
                return (
                  <Link
                    key={program.id}
                    href={`/${locale}/dashboard/programs/${program.id}`}
                    className="flex items-center gap-4 px-5 py-4 transition-colors hover:bg-[var(--surface-2)]"
                  >
                    <span
                      className="h-9 w-9 shrink-0 rounded-full"
                      style={{ backgroundColor: config?.primary_color ?? merchant.brand_color_primary }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-[var(--ink)]">{program.name}</p>
                      <p className="text-xs capitalize text-[var(--muted)]">{t("programTypeLabel", { type: program.type })}</p>
                    </div>
                    <Badge variant={program.is_active ? "success" : "default"}>
                      {program.is_active ? t("active") : t("inactive")}
                    </Badge>
                  </Link>
                );
              })}
            </Card>
          </section>
        </>
      ) : (
        <div className="mt-4 flex flex-col items-center justify-center rounded-3xl bg-[var(--surface)] p-12 text-center shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <EmptyPhoneMockup locale={locale} />
          <h3 className="mt-6 text-lg font-semibold text-[var(--ink)]">{t("noProgramsYetTitle")}</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">{t("emptyPrograms")}</p>
        </div>
      )}
    </div>
  );
}
