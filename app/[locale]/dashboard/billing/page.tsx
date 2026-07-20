"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type MerchantInfo = { plan: string };

export default function BillingPage() {
  const t = useTranslations("billing");
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((j) => setMerchant(j.data ?? null))
      .catch(() => setMerchant(null));
  }, []);

  async function checkout(plan: "starter" | "pro") {
    setMessage(null);
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error?.message ?? t("notConfigured"));
      return;
    }
    if (json.data?.url) window.location.href = json.data.url;
  }

  async function portal() {
    setMessage(null);
    const res = await fetch("/api/billing/portal", { method: "POST" });
    const json = await res.json();
    if (!res.ok) {
      setMessage(json.error?.message ?? t("notConfigured"));
      return;
    }
    if (json.data?.url) window.location.href = json.data.url;
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--muted)]">
        {t("currentPlan")}: <span className="font-semibold text-[var(--ink)]">{merchant?.plan ?? "…"}</span>
      </p>
      {message && <p className="mt-4 text-sm text-red-700">{message}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <Button onClick={() => checkout("starter")}>{t("upgrade")} Starter</Button>
        <Button variant="secondary" onClick={() => checkout("pro")}>
          {t("upgrade")} Pro
        </Button>
        <Button variant="outline" onClick={portal}>
          {t("manage")}
        </Button>
      </div>
    </div>
  );
}
