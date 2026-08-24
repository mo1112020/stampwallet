"use client";

import { useTranslations } from "next-intl";

/** Shown under the customers table once billing enforcement has actually
 * moved a merchant onto the Free plan (see lib/billing/enforcement.tsx) and
 * they have more customers than that plan allows visible — a soft paywall,
 * not a hard block: the data still exists and comes back the moment they
 * resubscribe, nothing was deleted. */
export function BillingBlurBanner({ hiddenCount, pricingUrl }: { hiddenCount: number; pricingUrl: string }) {
  const t = useTranslations("billingBlur");
  if (hiddenCount <= 0) return null;
  return (
    <div className="mt-3 rounded-xl border border-[var(--line)] bg-[var(--surface-2)] p-4 text-center">
      <p className="text-sm font-medium text-[var(--ink)]">{t("hiddenMessage", { count: hiddenCount })}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{t("hiddenSubtext")}</p>
      <a
        href={pricingUrl}
        className="mt-3 inline-block rounded-full bg-[var(--primary)] px-4 py-2 text-sm font-semibold text-white"
      >
        {t("resubscribe")}
      </a>
    </div>
  );
}
