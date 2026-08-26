"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Label, Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Plan, PlanInterval, SubscriptionStatus } from "@/types";

type Initial = {
  plan: Plan;
  plan_interval: PlanInterval | null;
  subscription_status: SubscriptionStatus | null;
  current_period_ends_at: string | null;
};

const PLANS: Plan[] = ["free", "starter", "pro", "enterprise"];
const INTERVALS: PlanInterval[] = ["monthly", "quarterly", "yearly"];
const STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due", "paused", "canceled"];

// current_period_ends_at is stored/read as an ISO timestamp but edited as a
// plain date -- "paid until Aug 31" is stored as 23:59:59 UTC of that date,
// so access reads as still-active through the whole day the merchant paid
// for.
function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  return iso.slice(0, 10);
}

function toIsoEndOfDay(dateInput: string): string | null {
  if (!dateInput) return null;
  return `${dateInput}T23:59:59.000Z`;
}

export function MerchantEditForm({ merchantId, initial }: { merchantId: string; initial: Initial }) {
  const router = useRouter();
  const [plan, setPlan] = useState<Plan>(initial.plan);
  const [planInterval, setPlanInterval] = useState<PlanInterval | "">(initial.plan_interval ?? "");
  const [status, setStatus] = useState<SubscriptionStatus | "">(initial.subscription_status ?? "");
  const [paidUntil, setPaidUntil] = useState(toDateInputValue(initial.current_period_ends_at));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    const res = await fetch(`/api/admin/merchants/${merchantId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        plan,
        plan_interval: planInterval || null,
        subscription_status: status || null,
        current_period_ends_at: toIsoEndOfDay(paidUntil),
      }),
    });

    setSaving(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.error?.message ?? "Update failed");
      return;
    }
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="plan">Plan</Label>
          <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
            <SelectTrigger id="plan">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLANS.map((p) => (
                <SelectItem key={p} value={p}>
                  {p}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Subscription status</Label>
          <Select value={status || "none"} onValueChange={(v) => setStatus(v === "none" ? "" : (v as SubscriptionStatus))}>
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No subscription</SelectItem>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="interval">Billing interval</Label>
          <Select value={planInterval || "none"} onValueChange={(v) => setPlanInterval(v === "none" ? "" : (v as PlanInterval))}>
            <SelectTrigger id="interval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {INTERVALS.map((i) => (
                <SelectItem key={i} value={i}>
                  {i}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="paidUntil">Paid until</Label>
          <Input
            id="paidUntil"
            type="date"
            value={paidUntil}
            onChange={(e) => setPaidUntil(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      {success && <p className="text-sm text-[var(--success)]">Saved.</p>}

      <Button type="submit" disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  );
}
