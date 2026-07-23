"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { UsagePanel } from "@/components/dashboard/billing/usage-panel";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";

type MerchantInfo = { plan: string };
type Usage = {
  programs: { used: number; limit: number | null };
  customers: { used: number; limit: number | null };
  seats: { used: number; limit: number | null };
  locations: { used: number; limit: number | null };
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
  const [usageFailed, setUsageFailed] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[] | null>(null);
  const [pendingPlan, setPendingPlan] = useState<"starter" | "pro" | "portal" | null>(null);

  useEffect(() => {
    fetch("/api/merchants/me")
      .then((r) => r.json())
      .then((j) => setMerchant(j.data ?? null))
      .catch(() => setMerchant(null));
    fetch("/api/billing/usage")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j) => setUsage(j.data ?? null))
      .catch(() => setUsageFailed(true));
    fetch("/api/billing/invoices")
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((j) => setInvoices(j.data ?? []))
      .catch(() => setInvoices([]));
  }, []);

  async function checkout(plan: "starter" | "pro") {
    setPendingPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? t("notConfigured"));
        return;
      }
      if (json.data?.url) window.location.href = json.data.url;
    } finally {
      setPendingPlan(null);
    }
  }

  async function portal() {
    setPendingPlan("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? t("notConfigured"));
        return;
      }
      if (json.data?.url) window.location.href = json.data.url;
    } finally {
      setPendingPlan(null);
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--ink)]">
        {t("title")}
      </h1>
      <div className="mt-4 flex items-center gap-1.5 text-[var(--muted)]">
        {t("currentPlan")}:
        {merchant ? (
          <span className="font-semibold capitalize text-[var(--ink)]">{merchant.plan}</span>
        ) : (
          <Skeleton className="inline-block h-4 w-16 align-middle" />
        )}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button onClick={() => checkout("starter")} disabled={pendingPlan !== null}>
          {pendingPlan === "starter" ? t("processing") : `${t("upgrade")} Starter`}
        </Button>
        <Button
          variant="secondary"
          onClick={() => checkout("pro")}
          disabled={pendingPlan !== null}
        >
          {pendingPlan === "pro" ? t("processing") : `${t("upgrade")} Pro`}
        </Button>
        <a
          href="mailto:sales@stampwallet.app?subject=Enterprise%20plan"
          className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]"
        >
          {t("contactSales")} — Enterprise
        </a>
        <Button variant="outline" onClick={portal} disabled={pendingPlan !== null}>
          {pendingPlan === "portal" ? t("processing") : t("manage")}
        </Button>
      </div>

      <Reveal className="mt-8">
        {usage && <UsagePanel usage={usage} />}
        {!usage && !usageFailed && (
          <Card>
            <CardContent className="space-y-4 pt-5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-1.5 w-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-1.5 w-full" />
            </CardContent>
          </Card>
        )}
        {usageFailed && (
          <Card>
            <CardContent className="pt-5 text-sm text-[var(--muted)]">{t("usageLoadFailed")}</CardContent>
          </Card>
        )}
      </Reveal>

      <div className="mt-8">
        <p className="text-sm font-semibold text-[var(--ink)]">{t("invoicesTitle")}</p>
        {invoices === null && (
          <div className="mt-3 space-y-2">
            <SkeletonRow />
            <SkeletonRow />
          </div>
        )}
        {invoices?.length === 0 && (
          <p className="mt-2 text-sm text-[var(--muted)]">{t("noInvoices")}</p>
        )}
        {invoices && invoices.length > 0 && (
          <StaggerGroup className="mt-3 space-y-2">
            {invoices.map((inv) => (
              <Card key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
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
                    className="text-sm font-medium text-[var(--primary)] hover:underline"
                  >
                    {t("viewInvoice")}
                  </a>
                )}
              </Card>
            ))}
          </StaggerGroup>
        )}
      </div>
    </div>
  );
}
