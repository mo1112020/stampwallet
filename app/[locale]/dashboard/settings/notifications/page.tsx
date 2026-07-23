"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import type { Merchant, NotificationPrefs } from "@/types";

const TOGGLES: (keyof NotificationPrefs)[] = [
  "reward_unlocked",
  "birthday",
  "expiring_reward",
  "inactive_customer",
];

export default function NotificationsSettingsPage() {
  const t = useTranslations("settings.notifications");
  const [prefs, setPrefs] = useState<NotificationPrefs>({});
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((json) => {
        const m = json.data as Merchant;
        setPrefs(m.notification_prefs ?? {});
        setLoaded(true);
      });
  }, []);

  async function save(next: NotificationPrefs) {
    setPrefs(next);
    setSaving(true);
    const res = await fetch("/api/settings/merchant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_prefs: next }),
    });
    setSaving(false);
    if (!res.ok) toast.error(t("saveFailed"));
  }

  if (!loaded) {
    return (
      <div className="max-w-md space-y-4">
        <Skeleton className="h-4 w-3/4" />
        <div className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
          {TOGGLES.map((key) => (
            <div key={key} className="flex items-center justify-between px-4 py-3">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-6 w-11 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
      <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
        {TOGGLES.map((key) => (
          <li key={key} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">{t(`toggles.${key}.label`)}</p>
              <p className="text-xs text-[var(--muted)]">{t(`toggles.${key}.description`)}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(prefs[key])}
              onClick={() => save({ ...prefs, [key]: !prefs[key] })}
              disabled={saving}
              className={`h-6 w-11 shrink-0 rounded-full transition-colors ${
                prefs[key] ? "bg-[var(--primary)]" : "bg-[var(--line-strong)]"
              }`}
            >
              <span
                className={`block h-5 w-5 translate-x-0.5 rtl:-translate-x-0.5 rounded-full bg-white transition-transform ${
                  prefs[key] ? "translate-x-[22px] rtl:-translate-x-[22px]" : ""
                }`}
              />
            </button>
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--muted)]">{t("comingSoonNote")}</p>
    </div>
  );
}
