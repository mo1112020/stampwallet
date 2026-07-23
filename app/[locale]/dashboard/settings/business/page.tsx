"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import type { Merchant } from "@/types";

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "PKR"];

export default function BusinessMetricsPage() {
  const t = useTranslations("settings.business");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [currency, setCurrency] = useState("");
  const [aov, setAov] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((json) => {
        const m = json.data as Merchant;
        setMerchant(m);
        setCurrency(m.currency ?? "");
        setAov(m.average_order_value != null ? String(m.average_order_value) : "");
      });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/settings/merchant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: currency || null,
        average_order_value: aov ? Number(aov) : null,
      }),
    });
    setSaving(false);
    if (res.ok) {
      toast.success(t("saved"));
    } else {
      toast.error(t("saveFailed"));
    }
  }

  if (!merchant) {
    return (
      <div className="max-w-md space-y-4">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-10 w-28" />
      </div>
    );
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
      <div>
        <Label htmlFor="aov">{t("averageOrderValue")}</Label>
        <Input
          id="aov"
          type="number"
          min={0}
          step="0.01"
          value={aov}
          onChange={(e) => setAov(e.target.value)}
          placeholder={t("optional")}
        />
      </div>
      <p className="text-xs text-[var(--muted)]">{t("rewardValueHint")}</p>
      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
