"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { Check, CreditCard, FileText, Minus, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import type { BillingInvoice, BillingUsage } from "@/lib/billing/data";
import { cn } from "@/lib/utils";
import type { Plan } from "@/types";

const UPGRADE_PLANS: { plan: "starter" | "pro"; blurb: string }[] = [
  { plan: "starter", blurb: "For growing businesses ready to customize their brand." },
  { plan: "pro", blurb: "For established loyalty programs across multiple locations." },
];

const COMPARE_PLANS: Plan[] = ["free", "starter", "pro", "enterprise"];

function limitLabel(value: number | null) {
  return value === null ? "Unlimited" : value.toLocaleString();
}

const COMPARE_ROWS: { label: string; sub?: string; render: (plan: Plan) => React.ReactNode }[] = [
  { label: "Active programs", render: (p) => limitLabel(PLAN_LIMITS[p].maxActivePrograms) },
  { label: "Customers", render: (p) => limitLabel(PLAN_LIMITS[p].maxActiveCustomers) },
  { label: "Team seats", render: (p) => limitLabel(PLAN_LIMITS[p].maxSeats) },
  {
    label: "Store locations",
    sub: "Geo-push on Apple & Google Wallet",
    render: (p) => limitLabel(PLAN_LIMITS[p].maxLocations),
  },
  {
    label: "Custom branding",
    render: (p) =>
      PLAN_LIMITS[p].customBranding ? (
        <Check className="mx-auto h-4 w-4 text-[var(--success)]" />
      ) : (
        <Minus className="mx-auto h-4 w-4 text-[var(--muted)]" />
      ),
  },
  {
    label: "Card expiration",
    sub: "Cards expire a set number of days after joining",
    render: (p) =>
      PLAN_LIMITS[p].cardExpiration ? (
        <Check className="mx-auto h-4 w-4 text-[var(--success)]" />
      ) : (
        <Minus className="mx-auto h-4 w-4 text-[var(--muted)]" />
      ),
  },
  { label: "Apple & Google Wallet passes", render: () => <Check className="mx-auto h-4 w-4 text-[var(--success)]" /> },
  { label: "Wallet-native notifications", render: () => <Check className="mx-auto h-4 w-4 text-[var(--success)]" /> },
  { label: "Printable marketing materials", render: () => <Check className="mx-auto h-4 w-4 text-[var(--success)]" /> },
  { label: "Analytics dashboard", render: () => <Check className="mx-auto h-4 w-4 text-[var(--success)]" /> },
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

/**
 * All the interactive bits (checkout/portal redirects) for the billing
 * page, seeded with data the server already fetched — no client-side
 * fetch-on-mount, so there's no loading flash on navigation.
 */
export function BillingContent({
  plan,
  usage,
  usageFailed,
  invoices,
}: {
  plan: Plan;
  usage: BillingUsage | null;
  usageFailed: boolean;
  invoices: BillingInvoice[];
}) {
  const t = useTranslations("billing");
  const [pendingPlan, setPendingPlan] = useState<"starter" | "pro" | "portal" | null>(null);

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

  const openInvoice = invoices.find((inv) => inv.status === "open");

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
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-2xl font-bold capitalize text-[var(--ink)]">{plan}</h2>
                {PLAN_LIMITS[plan].customBranding && <Badge variant="primary">Custom branding</Badge>}
              </div>
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
          {UPGRADE_PLANS.map(({ plan: upgradePlan, blurb }) => {
            const limits = PLAN_LIMITS[upgradePlan];
            const isCurrent = plan === upgradePlan;
            return (
              <Card key={upgradePlan} className={cn("flex flex-col p-6", isCurrent && "ring-2 ring-[var(--primary)]")}>
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold capitalize text-[var(--ink)]">{upgradePlan}</h4>
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
                  onClick={() => checkout(upgradePlan)}
                >
                  {isCurrent ? "Current plan" : pendingPlan === upgradePlan ? t("processing") : `${t("upgrade")} ${upgradePlan}`}
                </Button>
              </Card>
            );
          })}
        </StaggerGroup>
      </section>

      {/* Compare plans */}
      <section className="mt-8">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Compare plans</h3>
        <Card className="mt-3 overflow-x-auto p-0">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--line)]">
                <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">
                  Features
                </th>
                {COMPARE_PLANS.map((p) => (
                  <th key={p} className="px-5 py-3 text-center">
                    <span
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide",
                        plan === p ? "text-[var(--primary)]" : "text-[var(--muted)]"
                      )}
                    >
                      {p}
                    </span>
                    {plan === p && <Badge variant="primary" className="ms-2">Current</Badge>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {COMPARE_ROWS.map((row) => (
                <tr key={row.label}>
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-[var(--ink)]">{row.label}</p>
                    {row.sub && <p className="mt-0.5 text-xs text-[var(--muted)]">{row.sub}</p>}
                  </td>
                  {COMPARE_PLANS.map((p) => (
                    <td
                      key={p}
                      className={cn(
                        "px-5 py-3.5 text-center text-[var(--ink)]",
                        plan === p && "bg-[var(--primary-soft)]/40"
                      )}
                    >
                      {row.render(p)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
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
          {invoices.length === 0 && (
            <Card className="mt-3">
              <CardContent className="pt-5 text-sm text-[var(--muted)]">{t("noInvoices")}</CardContent>
            </Card>
          )}
          {invoices.length > 0 && (
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
