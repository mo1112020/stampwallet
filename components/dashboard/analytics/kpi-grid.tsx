import { getTranslations } from "next-intl/server";
import type { AnalyticsOverview } from "@/lib/analytics/queries";

export async function KpiGrid({ overview }: { overview: AnalyticsOverview }) {
  const t = await getTranslations("analytics");

  const cards: { label: string; value: string }[] = [
    { label: t("totalCustomers"), value: overview.totalCustomers.toLocaleString() },
    { label: t("activeCustomers"), value: overview.activeCustomers.toLocaleString() },
    { label: t("totalCards"), value: overview.totalCards.toLocaleString() },
    { label: t("activeCards"), value: overview.activeCards.toLocaleString() },
    { label: t("rewardsRedeemed"), value: overview.rewardsRedeemed.toLocaleString() },
    { label: t("totalScans"), value: overview.totalScans.toLocaleString() },
    { label: t("pointsEarned"), value: overview.pointsEarned.toLocaleString() },
    { label: t("pointsRedeemed"), value: overview.pointsRedeemed.toLocaleString() },
    { label: t("retentionRate"), value: `${overview.retentionRate}%` },
    { label: t("repeatVisits"), value: overview.repeatVisits.toLocaleString() },
  ];

  if (overview.revenueImpact !== null) {
    cards.push({
      label: t("revenueImpact"),
      value: new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: overview.currency ?? "USD",
        maximumFractionDigits: 0,
      }).format(overview.revenueImpact),
    });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
          <p className="text-sm text-[var(--muted)]">{card.label}</p>
          <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">{card.value}</p>
        </div>
      ))}
    </div>
  );
}
