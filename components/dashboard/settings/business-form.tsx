"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/input";
import { toast } from "@/components/ui/toaster";
import type { Merchant } from "@/types";

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "PKR"];

export function BusinessForm({ merchant }: { merchant: Merchant }) {
  const t = useTranslations("settings.business");
  const [currency, setCurrency] = useState(merchant.currency ?? "");
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/merchant", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currency: currency || null,
        }),
      });
      if (res.ok) {
        toast.success(t("saved"));
        router.refresh();
      } else {
        toast.error(t("saveFailed"));
      }
    } catch {
      toast.error(t("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
      <div>
        <Label htmlFor="currency">{t("currency")}</Label>
        <Select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          <option value="">{t("notSet")}</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </div>
      <p className="text-xs text-[var(--muted)]">{t("rewardValueHint")}</p>
      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
