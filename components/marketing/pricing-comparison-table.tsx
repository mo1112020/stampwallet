import { PLAN_LIMITS, type PaidPlan } from "@/lib/billing/plans";

/** Sits alongside (not instead of) the interactive plan cards above — a
 * real <table> for the same data, sourced directly from PLAN_LIMITS so it
 * can never drift from what the app actually enforces. Cards are the better
 * human decision-making UI; a table is what a search/AI system can parse a
 * side-by-side comparison out of, which the cards alone don't offer. */
export function PricingComparisonTable({
  t,
}: {
  t: (key: string) => string;
}) {
  const plans: { key: "free" | PaidPlan; name: string }[] = [
    { key: "free", name: t("freeName") },
    { key: "starter", name: t("starterName") },
    { key: "pro", name: t("proName") },
  ];

  const fmt = (n: number | null) => (n === null ? t("compare.unlimited") : n.toLocaleString());
  const bool = (b: boolean) => (b ? t("compare.yes") : t("compare.no"));

  const rows: { label: string; values: (plan: "free" | PaidPlan) => string }[] = [
    { label: t("compare.programs"), values: (p) => fmt(PLAN_LIMITS[p].maxActivePrograms) },
    { label: t("compare.customers"), values: (p) => fmt(PLAN_LIMITS[p].maxActiveCustomers) },
    { label: t("compare.seats"), values: (p) => fmt(PLAN_LIMITS[p].maxSeats) },
    { label: t("compare.locations"), values: (p) => fmt(PLAN_LIMITS[p].maxLocations) },
    { label: t("compare.branding"), values: (p) => bool(PLAN_LIMITS[p].customBranding) },
    { label: t("compare.expiration"), values: (p) => bool(PLAN_LIMITS[p].cardExpiration) },
  ];

  return (
    <div className="mx-auto mt-16 max-w-4xl px-6">
      <h2 className="text-center text-2xl font-bold tracking-tight text-[var(--ink)] md:text-3xl">
        {t("compareTitle")}
      </h2>
      <div className="mt-8 overflow-x-auto border-2 border-[var(--line-strong)]">
        <table className="w-full min-w-[480px] border-collapse text-start text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--line-strong)] bg-[var(--surface-2)]">
              <th className="px-4 py-3 text-start font-bold text-[var(--ink)]">{t("compare.plan")}</th>
              {plans.map((p) => (
                <th key={p.key} className="px-4 py-3 text-start font-bold text-[var(--ink)]">
                  {p.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-b border-[var(--line)] last:border-b-0">
                <td className="px-4 py-3 font-medium text-[var(--ink)]">{row.label}</td>
                {plans.map((p) => (
                  <td key={p.key} className="px-4 py-3 text-[var(--muted)]">
                    {row.values(p.key)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
