"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import type { NotificationPrefs } from "@/types";

const TOGGLES: (keyof NotificationPrefs)[] = [
  "reward_unlocked",
  "birthday",
  "expiring_reward",
  "inactive_customer",
];

export function NotificationsPrefsForm({ initialPrefs }: { initialPrefs: NotificationPrefs }) {
  const t = useTranslations("settings.notifications");
  const [prefs, setPrefs] = useState<NotificationPrefs>(initialPrefs);
  const [saving, setSaving] = useState(false);
  // Local draft, separate from `prefs.birthday_message` — a text field
  // shouldn't PATCH on every keystroke the way the toggles' save() does,
  // so this only syncs to the server on an explicit save.
  const [birthdayMessage, setBirthdayMessage] = useState(initialPrefs.birthday_message ?? "");
  const [savingMessage, setSavingMessage] = useState(false);
  const router = useRouter();

  async function save(next: NotificationPrefs) {
    const previous = prefs;
    setPrefs(next);
    setSaving(true);
    try {
      const res = await fetch("/api/settings/merchant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_prefs: next }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setPrefs(previous);
        toast.error(t("saveFailed"));
      }
    } catch {
      setPrefs(previous);
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function saveBirthdayMessage() {
    setSavingMessage(true);
    try {
      const next = { ...prefs, birthday_message: birthdayMessage.trim() || undefined };
      const res = await fetch("/api/settings/merchant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notification_prefs: next }),
      });
      if (res.ok) {
        setPrefs(next);
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(t("saveFailed"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSavingMessage(false);
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
      <ul className="divide-y divide-[var(--line)] rounded-2xl border border-[var(--line)]">
        {TOGGLES.map((key) => (
          <li key={key}>
            <div className="flex items-center justify-between px-4 py-3">
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
                // The visible track is only 24px tall (h-6) — well under the
                // ~44px minimum touch target — so the invisible ::after
                // extends the actual tap area vertically without changing how
                // the switch looks.
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors after:absolute after:-inset-y-3 after:inset-x-0 after:content-[''] active:scale-95 disabled:opacity-50 ${
                  prefs[key] ? "bg-[var(--primary)]" : "bg-[var(--line-strong)]"
                }`}
              >
                <span
                  className={`block h-5 w-5 translate-x-0.5 rtl:-translate-x-0.5 rounded-full bg-white transition-transform ${
                    prefs[key] ? "translate-x-[22px] rtl:-translate-x-[22px]" : ""
                  }`}
                />
              </button>
            </div>
            {key === "birthday" && prefs.birthday && (
              <div className="space-y-2 border-t border-[var(--line)] bg-[var(--surface-2)] px-4 py-3">
                <label className="text-xs font-medium text-[var(--ink)]" htmlFor="birthday_message">
                  {t("toggles.birthday.messageLabel")}
                </label>
                <Textarea
                  id="birthday_message"
                  value={birthdayMessage}
                  onChange={(e) => setBirthdayMessage(e.target.value)}
                  placeholder={t("toggles.birthday.messagePlaceholder")}
                  rows={2}
                  className="bg-[var(--surface)]"
                />
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs text-[var(--muted)]">{t("toggles.birthday.messageHint")}</p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="shrink-0"
                    disabled={savingMessage || birthdayMessage.trim() === (prefs.birthday_message ?? "").trim()}
                    onClick={saveBirthdayMessage}
                  >
                    {t("toggles.birthday.saveMessage")}
                  </Button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="text-xs text-[var(--muted)]">{t("activeNote")}</p>
    </div>
  );
}
