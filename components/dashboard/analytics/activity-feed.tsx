import { getTranslations } from "next-intl/server";
import type { ActivityEntry } from "@/lib/analytics/queries";

export async function ActivityFeed({ entries }: { entries: ActivityEntry[] }) {
  const t = await getTranslations("analytics");

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-sm font-semibold text-[var(--ink)]">{t("recentActivity")}</p>
      {entries.length === 0 ? (
        <p className="mt-3 text-sm text-[var(--muted)]">{t("noActivity")}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between rounded-xl border border-[var(--line)] px-4 py-3 text-sm"
            >
              <div>
                <p className="font-medium text-[var(--ink)]">
                  {entry.customerName || t("unknownCustomer")}
                  {entry.type === "redemption" && <span className="ml-2">🎁</span>}
                </p>
                <p className="text-[var(--muted)]">
                  {entry.programName} · {entry.detail}
                </p>
              </div>
              <div className="text-[var(--muted)]">
                {new Date(entry.createdAt).toLocaleString(undefined, {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
