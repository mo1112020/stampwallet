"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import type { Merchant } from "@/types";

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "AED", "EGP", "PKR"];

export default function BusinessMetricsPage() {
  const t = useTranslations("settings.business");
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [currency, setCurrency] = useState("");
  const [aov, setAov] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    setMessage(null);
    const res = await fetch("/api/settings/merchant", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currency: currency || null,
        average_order_value: aov ? Number(aov) : null,
      }),
    });
    setSaving(false);
    setMessage(res.ok ? t("saved") : t("saveFailed"));
  }

  if (!merchant) return <p className="text-sm text-[var(--muted)]">{t("loading")}</p>;

  return (
    <form onSubmit={onSubmit} className="max-w-md space-y-4">
      <p className="text-sm text-[var(--muted)]">{t("intro")}</p>
      <div>
        <Label htmlFor="currency">{t("currency")}</Label>
        <select
          id="currency"
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="flex h-12 w-full rounded-full border border-[var(--line)] bg-white px-4 text-[15px] text-[var(--ink)]"
        >
          <option value="">{t("notSet")}</option>
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
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
      {message && <p className="text-sm text-[var(--muted)]">{message}</p>}
      <Button type="submit" disabled={saving}>
        {saving ? t("saving") : t("save")}
      </Button>
    </form>
  );
}
