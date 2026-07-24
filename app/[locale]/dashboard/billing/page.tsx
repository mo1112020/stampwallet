"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { CreditCard, FileText, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton, SkeletonRow } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toaster";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

type MerchantInfo = { plan: Plan; business_name?: string };
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

const UPGRADE_PLANS: { plan: "starter" | "pro"; blurb: string }[] = [
  { plan: "starter", blurb: "For growing businesses ready to customize their brand." },
  { plan: "pro", blurb: "For established loyalty programs across multiple locations." },
];

function UsageBar({ used, limit }: { used: number; limit: number | null }) {
  if (limit === null) return null;
  const pct = limit === 0 ? 100 : Math.min(100, (used / limit) * 100);
  const nearLimit = pct >= 90;
  return (
    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-2)]">
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", nearLimit ? "bg-[var(--danger)]" : "bg-[var(--primary)]")}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

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

  const openInvoice = invoices?.find((inv) => inv.status === "open");

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Manage your plan, usage, and payment details.</p>

      {/* Current plan hero */}
      <Reveal as="div" className="mt-6">
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("currentPlan")}</p>
              {merchant ? (
                <div className="mt-1 flex items-center gap-2">
                  <h2 className="text-2xl font-bold capitalize text-[var(--ink)]">{merchant.plan}</h2>
                  {PLAN_LIMITS[merchant.plan].customBranding && <Badge variant="primary">Custom branding</Badge>}
                </div>
              ) : (
                <Skeleton className="mt-2 h-7 w-32" />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={portal} disabled={pendingPlan !== null}>
                <CreditCard className="mr-2 h-4 w-4" />
                {pendingPlan === "portal" ? t("processing") : t("manage")}
              </Button>
              <a
                href="mailto:sales@stampwallet.app?subject=Enterprise%20plan"
                className="inline-flex h-11 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
              >
                {t("contactSales")} — Enterprise
              </a>
            </div>
          </div>
        </Card>
      </Reveal>

      {/* Upgrade options */}
      <section className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Plans</h3>
        <StaggerGroup className="mt-3 grid gap-4 sm:grid-cols-2">
          {UPGRADE_PLANS.map(({ plan, blurb }) => {
            const limits = PLAN_LIMITS[plan];
            const isCurrent = merchant?.plan === plan;
            return (
              <Card key={plan} className={cn("flex flex-col p-6", isCurrent && "ring-2 ring-[var(--primary)]")}>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold capitalize text-[var(--ink)]">{plan}</h4>
                  {isCurrent && <Badge variant="primary">Current</Badge>}
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{blurb}</p>
                <ul className="mt-4 space-y-1.5 text-sm text-[var(--muted)]">
                  <li>{limits.maxActivePrograms ?? "Unlimited"} active programs</li>
                  <li>{limits.maxActiveCustomers?.toLocaleString() ?? "Unlimited"} customers</li>
                  <li>{limits.maxSeats ?? "Unlimited"} team seats</li>
                  <li>{limits.maxLocations ?? "Unlimited"} locations</li>
                </ul>
                <Button
                  className="mt-5 w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || pendingPlan !== null}
                  onClick={() => checkout(plan)}
                >
                  {isCurrent ? "Current plan" : pendingPlan === plan ? t("processing") : `${t("upgrade")} ${plan}`}
                </Button>
              </Card>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Usage */}
      <section className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Usage</h3>
        {usage && (
          <StaggerGroup className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["programs", "Active programs"],
              ["customers", "Customers"],
              ["seats", "Team seats"],
              ["locations", "Locations"],
            ] as const).map(([key, label]) => {
              const metric = usage[key];
              return (
                <Card key={key} className="p-5">
                  <p className="text-sm text-[var(--muted)]">{label}</p>
                  <p className="mt-1.5 text-2xl font-semibold text-[var(--ink)]">
                    {metric.used.toLocaleString()}
                    <span className="text-sm font-normal text-[var(--muted)]">
                      {" "}
                      / {metric.limit !== null ? metric.limit.toLocaleString() : "∞"}
                    </span>
                  </p>
                  <UsageBar {...metric} />
                </Card>
              );
            })}
          </StaggerGroup>
        )}
        {!usage && !usageFailed && (
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="space-y-3 p-5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-1.5 w-full" />
              </Card>
            ))}
          </div>
        )}
        {usageFailed && (
          <Card className="mt-3">
            <CardContent className="pt-5 text-sm text-[var(--muted)]">{t("usageLoadFailed")}</CardContent>
          </Card>
        )}
      </section>

      {/* Billing history + sidebar */}
      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">{t("invoicesTitle")}</h3>
          {invoices === null && (
            <div className="mt-3 space-y-2">
              <SkeletonRow />
              <SkeletonRow />
            </div>
          )}
          {invoices?.length === 0 && (
            <Card className="mt-3">
              <CardContent className="pt-5 text-sm text-[var(--muted)]">{t("noInvoices")}</CardContent>
            </Card>
          )}
          {invoices && invoices.length > 0 && (
            <StaggerGroup className="mt-3 space-y-2">
              {invoices.map((inv) => (
                <Card key={inv.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface-2)]">
                      <FileText className="h-4 w-4 text-[var(--muted)]" />
                    </span>
                    <div>
                      <p className="font-medium text-[var(--ink)]">
                        {new Intl.NumberFormat(undefined, {
                          style: "currency",
                          currency: inv.currency.toUpperCase(),
                        }).format(inv.amount_paid / 100)}
                      </p>
                      <p className="text-[var(--muted)]">{new Date(inv.created * 1000).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={inv.status === "paid" ? "success" : inv.status === "open" ? "warning" : "default"} className="capitalize">
                      {inv.status}
                    </Badge>
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
                  </div>
                </Card>
              ))}
            </StaggerGroup>
          )}
        </section>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[var(--muted)]" />
              <p className="text-sm font-semibold text-[var(--ink)]">Upcoming invoice</p>
            </div>
            {openInvoice ? (
              <>
                <p className="mt-2 text-xl font-semibold text-[var(--ink)]">
                  {new Intl.NumberFormat(undefined, { style: "currency", currency: openInvoice.currency.toUpperCase() }).format(
                    openInvoice.amount_paid / 100
                  )}
                </p>
                <p className="mt-1 text-xs text-[var(--muted)]">Due {new Date(openInvoice.created * 1000).toLocaleDateString()}</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">
                Generated automatically when your billing period renews. View full details in the billing portal.
              </p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-[var(--muted)]" />
              <p className="text-sm font-semibold text-[var(--ink)]">Payment methods</p>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">Cards on file are managed securely through Stripe.</p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={portal} disabled={pendingPlan !== null}>
              Manage payment methods
            </Button>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--muted)]" />
              <p className="text-sm font-semibold text-[var(--ink)]">Subscription details</p>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Plan, seats, and renewal date are managed in the billing portal — cancel or change your plan any time.
            </p>
            <Button variant="outline" size="sm" className="mt-3 w-full" onClick={portal} disabled={pendingPlan !== null}>
              Open billing portal
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
