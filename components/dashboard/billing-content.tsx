"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, CreditCard, FileText, Minus, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/toaster";
import { Reveal } from "@/components/motion/reveal";
import { StaggerGroup } from "@/components/motion/stagger-group";
import { hasActiveAccess } from "@/lib/billing/access";
import { PLAN_LIMITS, PLAN_PRICES_USD_CENTS, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";
import type { BillingInvoice, BillingUsage } from "@/lib/billing/data";
import { cn } from "@/lib/utils";
import type { Merchant, Plan } from "@/types";

const UPGRADE_PLANS: { plan: PaidPlan; blurb: string; popular?: boolean }[] = [
  { plan: "starter", blurb: "For growing businesses ready to customize their brand." },
  { plan: "pro", blurb: "For established loyalty programs across multiple locations.", popular: true },
];

const INTERVALS: { value: PlanInterval; label: string; months: number }[] = [
  { value: "monthly", label: "Monthly", months: 1 },
  { value: "quarterly", label: "Quarterly", months: 3 },
  { value: "yearly", label: "Yearly", months: 12 },
];

/** Percentage saved vs paying monthly for the same duration — derived from
 * the real price table rather than hardcoded, so it can't drift out of sync
 * if prices change. Returns 0 for the monthly interval itself. */
function intervalSavingsPct(intervalValue: PlanInterval) {
  const months = INTERVALS.find((i) => i.value === intervalValue)!.months;
  if (months === 1) return 0;
  // Both paid plans currently share the same discount curve; averaging keeps
  // this honest if they ever diverge slightly.
  const pcts = (Object.keys(PLAN_PRICES_USD_CENTS) as PaidPlan[]).map((p) => {
    const atMonthly = PLAN_PRICES_USD_CENTS[p].monthly * months;
    const atInterval = PLAN_PRICES_USD_CENTS[p][intervalValue];
    return (atMonthly - atInterval) / atMonthly;
  });
  return Math.round((pcts.reduce((a, b) => a + b, 0) / pcts.length) * 100);
}

const COMPARE_PLANS: Plan[] = ["free", "starter", "pro", "enterprise"];

function limitLabel(value: number | null) {
  return value === null ? "Unlimited" : value.toLocaleString();
}

function formatUsd(cents: number) {
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(cents / 100);
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
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
 * All the interactive bits (Stripe checkout, plan switching, cancellation)
 * for the billing page, seeded with data the server already fetched — no
 * client-side fetch-on-mount, so there's no loading flash on navigation.
 * Checkout itself is a plain redirect to a Stripe-hosted page (the session
 * URL comes from POST /api/billing/checkout) — no client-side Stripe SDK
 * is loaded, and the secret key never leaves the server.
 */
export function BillingContent({
  merchant,
  usage,
  usageFailed,
  invoices,
  priceIds,
}: {
  merchant: Merchant;
  usage: BillingUsage | null;
  usageFailed: boolean;
  invoices: BillingInvoice[];
  priceIds: Record<PaidPlan, Record<PlanInterval, string | null>>;
}) {
  const t = useTranslations("billing");
  const router = useRouter();
  const [interval, setInterval] = useState<PlanInterval>(merchant.plan_interval ?? "quarterly");
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const hasActiveSubscription = hasActiveAccess(merchant.subscription_status);

  // Refresh server-fetched props shortly after an action — the Stripe
  // webhook (source of truth for merchants.plan/subscription_status) lands
  // asynchronously, typically sub-second, but not synchronously with this
  // response.
  function refreshSoon() {
    setTimeout(() => router.refresh(), 1500);
  }

  async function subscribe(plan: PaidPlan) {
    if (!priceIds[plan][interval]) {
      toast.error(t("notConfigured"));
      return;
    }
    setPendingAction(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const json = await res.json();
      if (!res.ok || !json.data?.url) {
        toast.error(json.error?.message ?? t("notConfigured"));
        return;
      }
      window.location.href = json.data.url;
    } finally {
      setPendingAction(null);
    }
  }

  async function switchPlan(plan: PaidPlan) {
    setPendingAction(plan);
    try {
      const res = await fetch("/api/billing/subscription", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? t("notConfigured"));
        return;
      }
      toast.success("Plan updated");
      refreshSoon();
    } finally {
      setPendingAction(null);
    }
  }

  async function selectPlan(plan: PaidPlan) {
    if (hasActiveSubscription) {
      await switchPlan(plan);
    } else {
      await subscribe(plan);
    }
  }

  async function cancelSubscription() {
    setPendingAction("cancel");
    try {
      const res = await fetch("/api/billing/subscription", { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error?.message ?? t("notConfigured"));
        return;
      }
      toast.success("Your subscription will end at the close of the current billing period.");
      setConfirmingCancel(false);
      refreshSoon();
    } finally {
      setPendingAction(null);
    }
  }

  async function openPortal() {
    setPendingAction("portal");
    try {
      const res = await fetch("/api/billing/portal", { method: "POST" });
      const json = await res.json();
      if (!res.ok || !json.data?.url) {
        toast.error(json.error?.message ?? t("notConfigured"));
        return;
      }
      window.location.href = json.data.url;
    } finally {
      setPendingAction(null);
    }
  }

  const openInvoice = invoices.find((inv) => inv.status === "open");
  const plan = merchant.plan;

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">Manage your plan, usage, and payment details.</p>

      {/* Current plan hero */}
      <Reveal as="div" className="mt-6">
        <Card className="overflow-hidden border-[var(--primary)]/20 bg-gradient-to-br from-[var(--primary-soft)]/50 to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-6 p-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--muted)]">{t("currentPlan")}</p>
              <div className="mt-1 flex items-center gap-2">
                <h2 className="text-3xl font-bold capitalize tracking-tight text-[var(--ink)]">{plan}</h2>
                {PLAN_LIMITS[plan].customBranding && <Badge variant="primary">Custom branding</Badge>}
              </div>
              {merchant.scheduled_cancel_at ? (
                <p className="mt-1.5 text-sm text-[var(--danger)]">
                  Cancels on {formatDate(merchant.scheduled_cancel_at)} — you keep access until then.
                </p>
              ) : merchant.current_period_ends_at && hasActiveSubscription ? (
                <p className="mt-1.5 text-sm text-[var(--muted)]">Renews {formatDate(merchant.current_period_ends_at)}</p>
              ) : null}
            </div>

            {/* At-a-glance usage — same data as the Usage section below, just
             * surfaced here too so the hero's wide middle isn't dead space
             * and a merchant doesn't have to scroll to see where they stand. */}
            {usage && (
              <div className="flex flex-1 flex-wrap items-center justify-center gap-x-6 gap-y-3">
                {([
                  ["programs", "Programs"],
                  ["customers", "Customers"],
                  ["seats", "Seats"],
                  ["locations", "Locations"],
                ] as const).map(([key, label]) => {
                  const metric = usage[key];
                  return (
                    <div key={key} className="text-center">
                      <p className="text-lg font-semibold tabular-nums text-[var(--ink)]">
                        {metric.used.toLocaleString()}
                        <span className="text-sm font-normal text-[var(--muted)]">
                          /{metric.limit !== null ? metric.limit.toLocaleString() : "∞"}
                        </span>
                      </p>
                      <p className="text-xs text-[var(--muted)]">{label}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {merchant.stripe_customer_id && (
                <Button variant="outline" onClick={openPortal} disabled={pendingAction !== null}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  {pendingAction === "portal" ? t("processing") : "Manage billing"}
                </Button>
              )}
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--muted)]">Plans</h3>
          <div className="inline-flex rounded-full border border-[var(--line)] p-1">
            {INTERVALS.map(({ value, label }) => {
              const savings = intervalSavingsPct(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setInterval(value)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                    interval === value ? "bg-[var(--primary)] text-white" : "text-[var(--muted)] hover:text-[var(--ink)]"
                  )}
                >
                  {label}
                  {savings > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                        interval === value
                          ? "bg-white/20 text-white"
                          : "bg-[var(--success-soft)] text-[var(--success)]"
                      )}
                    >
                      -{savings}%
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <StaggerGroup className="mt-3 grid gap-4 sm:grid-cols-2">
          {UPGRADE_PLANS.map(({ plan: upgradePlan, blurb, popular }) => {
            const limits = PLAN_LIMITS[upgradePlan];
            const isCurrent = plan === upgradePlan && merchant.plan_interval === interval && hasActiveSubscription;
            const cents = PLAN_PRICES_USD_CENTS[upgradePlan][interval];
            const months = INTERVALS.find((i) => i.value === interval)!.months;
            const monthlyEquivalent = cents / months;
            const fullPriceIfMonthly = PLAN_PRICES_USD_CENTS[upgradePlan].monthly;
            const features = [
              `${limits.maxActivePrograms ?? "Unlimited"} active programs`,
              `${limits.maxActiveCustomers?.toLocaleString() ?? "Unlimited"} customers`,
              `${limits.maxSeats ?? "Unlimited"} team seats`,
              `${limits.maxLocations ?? "Unlimited"} locations`,
            ];
            return (
              <Card
                key={upgradePlan}
                className={cn(
                  "relative flex flex-col p-6 transition-shadow hover:shadow-md",
                  isCurrent && "ring-2 ring-[var(--primary)]",
                  !isCurrent && popular && "ring-1 ring-[var(--primary)]/30"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-lg font-semibold capitalize text-[var(--ink)]">{upgradePlan}</h4>
                  {isCurrent ? (
                    <Badge variant="primary">Current</Badge>
                  ) : popular ? (
                    <Badge variant="primary">Most popular</Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-sm text-[var(--muted)]">{blurb}</p>
                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-[var(--ink)]">{formatUsd(monthlyEquivalent)}</span>
                  <span className="text-sm font-normal text-[var(--muted)]">/mo</span>
                  {interval !== "monthly" && (
                    <span className="text-sm text-[var(--muted)] line-through">{formatUsd(fullPriceIfMonthly)}</span>
                  )}
                </div>
                <p className="mt-1 min-h-[1rem] text-xs text-[var(--muted)]">
                  {interval !== "monthly" ? `${formatUsd(cents)} billed ${interval}` : "Billed monthly"}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-[var(--ink)]">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2">
                      <Check className="h-4 w-4 shrink-0 text-[var(--success)]" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="mt-6 w-full"
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || pendingAction !== null}
                  onClick={() => selectPlan(upgradePlan)}
                >
                  {isCurrent
                    ? "Current plan"
                    : pendingAction === upgradePlan
                      ? t("processing")
                      : hasActiveSubscription
                        ? `Switch to ${upgradePlan}`
                        : `${t("upgrade")} ${upgradePlan}`}
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
              <p className="mt-2 text-sm text-[var(--muted)]">Generated automatically when your billing period renews.</p>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-[var(--muted)]" />
              <p className="text-sm font-semibold text-[var(--ink)]">Subscription details</p>
            </div>
            {hasActiveSubscription ? (
              <>
                <p className="mt-2 text-sm text-[var(--muted)]">
                  Billed {merchant.plan_interval ?? "monthly"}
                  {merchant.current_period_ends_at && !merchant.scheduled_cancel_at && (
                    <> — renews {formatDate(merchant.current_period_ends_at)}</>
                  )}
                  {merchant.scheduled_cancel_at && <> — cancels {formatDate(merchant.scheduled_cancel_at)}</>}
                </p>
                {!merchant.scheduled_cancel_at &&
                  (confirmingCancel ? (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-[var(--muted)]">
                        You&apos;ll keep access until the end of this billing period. Cancel for real?
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          className="flex-1"
                          onClick={cancelSubscription}
                          disabled={pendingAction !== null}
                        >
                          {pendingAction === "cancel" ? t("processing") : "Yes, cancel"}
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1" onClick={() => setConfirmingCancel(false)}>
                          Never mind
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                      onClick={() => setConfirmingCancel(true)}
                      disabled={pendingAction !== null}
                    >
                      Cancel subscription
                    </Button>
                  ))}
              </>
            ) : (
              <p className="mt-2 text-sm text-[var(--muted)]">You&apos;re not on a paid plan yet — subscribe above to unlock upgrades.</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
