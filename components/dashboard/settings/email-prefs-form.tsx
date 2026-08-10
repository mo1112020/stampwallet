"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "@/components/ui/toaster";
import type { EmailPrefs } from "@/types";

const TOGGLES: (keyof EmailPrefs)[] = ["marketing", "product_updates"];

export function EmailPrefsForm({ initialPrefs }: { initialPrefs: EmailPrefs }) {
  const t = useTranslations("settings.emailPrefs");
  const tCommon = useTranslations("settings.notifications");
  const [prefs, setPrefs] = useState<EmailPrefs>(initialPrefs);
  const [saving, setSaving] = useState(false);

  async function save(next: EmailPrefs) {
    setPrefs(next);
    setSaving(true);
    const res = await fetch("/api/settings/merchant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email_prefs: next }),
    });
    setSaving(false);
    if (!res.ok) toast.error(tCommon("saveFailed"));
  }

  return (
    <div className="max-w-md space-y-4">
      <h2 className="text-sm font-semibold text-[var(--ink)]">{t("title")}</h2>
      <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
      <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
        {TOGGLES.map((key) => {
          const checked = prefs[key] !== false;
          return (
            <li key={key} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--ink)]">{t(`toggles.${key}.label`)}</p>
                <p className="text-xs text-[var(--muted)]">{t(`toggles.${key}.description`)}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => save({ ...prefs, [key]: !checked })}
                disabled={saving}
                className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
                  checked ? "bg-[var(--primary)]" : "bg-[var(--line-strong)]"
                }`}
              >
                <span
                  className={`block h-5 w-5 translate-x-0.5 rtl:-translate-x-0.5 rounded-full bg-white transition-transform ${
                    checked ? "translate-x-[22px] rtl:-translate-x-[22px]" : ""
                  }`}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
