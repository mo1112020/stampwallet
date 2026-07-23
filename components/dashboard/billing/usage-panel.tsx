"use client";

import { useTranslations } from "next-intl";

type UsageMetric = { used: number; limit: number | null };
type Usage = { programs: UsageMetric; customers: UsageMetric; seats: UsageMetric };

function Bar({ used, limit }: UsageMetric) {
  if (limit === null) return null;
  const pct = limit === 0 ? 100 : Math.min(100, (used / limit) * 100);
  const nearLimit = pct >= 90;
  return (
    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div
        className={`h-full rounded-full ${nearLimit ? "bg-red-500" : "bg-[var(--brand)]"}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function UsagePanel({ usage }: { usage: Usage }) {
  const t = useTranslations("billing.usage");

  const rows: { key: keyof Usage; label: string }[] = [
    { key: "programs", label: t("programs") },
    { key: "customers", label: t("customers") },
    { key: "seats", label: t("seats") },
  ];

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-semibold text-[var(--ink)]">{t("title")}</p>
      <div className="mt-4 space-y-4">
        {rows.map(({ key, label }) => {
          const metric = usage[key];
          return (
            <div key={key}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--muted)]">{label}</span>
                <span className="font-medium text-[var(--ink)]">
                  {metric.used.toLocaleString()}
                  {metric.limit !== null ? ` / ${metric.limit.toLocaleString()}` : ` / ${t("unlimited")}`}
                </span>
              </div>
              <Bar {...metric} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
