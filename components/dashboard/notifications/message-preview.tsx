"use client";

import { useTranslations } from "next-intl";

/**
 * Apple only ever surfaces the message body on the lock screen (PassKit's
 * `changeMessage: "%@"` substitutes the raw text, no separate title field) —
 * Google shows both, title as the message "header" and message as the "body".
 * See lib/wallet/apple.ts / lib/wallet/google.ts.
 */
export function MessagePreview({
  title,
  message,
  businessName,
  logoUrl,
}: {
  title: string;
  message: string;
  businessName: string;
  logoUrl?: string | null;
}) {
  const t = useTranslations("notifications");
  const trimmedTitle = title.trim();
  const trimmedMessage = message.trim();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-[#0b0b0f] p-4">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-white/40">{t("previewApple")}</p>
        <div className="flex items-start gap-2.5 rounded-2xl bg-white/10 p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white text-xs font-bold text-black">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              (businessName.trim().charAt(0) || "?").toUpperCase()
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-semibold text-white">{businessName || "Your business"}</span>
              <span className="shrink-0 text-[11px] text-white/50">now</span>
            </div>
            <p className="mt-0.5 line-clamp-2 text-[13px] leading-snug text-white/85">
              {trimmedMessage || t("previewEmptyMessage")}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-2)] p-4">
        <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted)]">{t("previewGoogle")}</p>
        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
          <p className="text-[13px] font-semibold text-[var(--ink)]">{trimmedTitle || t("previewEmptyTitle")}</p>
          <p className="mt-1 text-[13px] leading-snug text-[var(--muted)]">{trimmedMessage || t("previewEmptyMessage")}</p>
        </div>
      </div>
    </div>
  );
}
