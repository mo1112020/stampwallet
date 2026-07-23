"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { UsagePanel } from "@/components/dashboard/billing/usage-panel";

type MerchantInfo = { plan: string };
type Usage = {
  programs: { used: number; limit: number | null };
  customers: { used: number; limit: number | null };
  seats: { used: number; limit: number | null };
};
type Invoice = {
  id: string;
  amount_paid: number;
  currency: string;
  status: string | null;
  created: number;
  hosted_invoice_url: string | null;
};

export default function BillingPage() {
  const t = useTranslations("billing");
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((j) => setMerchant(j.data ?? null))
      .catch(() => setMerchant(null));
    fetch("/api/billing/usage")
      .then((r) => r.json())
      .then((j) => setUsage(j.data ?? null))
      .catch(() => setUsage(null));
    fetch("/api/billing/invoices")
      .then((r) => r.json())
      .then((j) => setInvoices(j.data ?? []))
      .catch(() => setInvoices([]));
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
    <div className="max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {t("title")}
      </h1>
      <p className="mt-4 text-[var(--muted)]">
        {t("currentPlan")}: <span className="font-semibold capitalize text-[var(--ink)]">{merchant?.plan ?? "…"}</span>
      </p>
      {message && <p className="mt-4 text-sm text-red-700">{message}</p>}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => checkout("starter")}>{t("upgrade")} Starter</Button>
        <Button variant="secondary" onClick={() => checkout("pro")}>
          {t("upgrade")} Pro
        </Button>
        <a
          href="mailto:sales@stampwallet.app?subject=Enterprise%20plan"
          className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
        >
          {t("contactSales")} — Enterprise
        </a>
        <Button variant="outline" onClick={portal}>
          {t("manage")}
        </Button>
      </div>

      {usage && (
        <div className="mt-8">
          <UsagePanel usage={usage} />
        </div>
      )}

      <div className="mt-8">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("invoicesTitle")}</p>
        {invoices.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noInvoices")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {invoices.map((inv) => (
              <li
                key={inv.id}
                className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-[var(--ink)]">
                    {new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: inv.currency.toUpperCase(),
                    }).format(inv.amount_paid / 100)}
                  </p>
                  <p className="text-[var(--muted)]">
                    {new Date(inv.created * 1000).toLocaleDateString()} · {inv.status}
                  </p>
                </div>
                {inv.hosted_invoice_url && (
                  <a
                    href={inv.hosted_invoice_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm font-medium text-[var(--brand)] hover:underline"
                  >
                    {t("viewInvoice")}
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
