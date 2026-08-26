import { jsonOk, jsonError } from "@/lib/api";
import { requirePlatformAdmin } from "@/lib/auth/platform-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasActiveAccess } from "@/lib/billing/access";
import { enforceBillingLimits, restoreBillingLimits } from "@/lib/billing/enforcement";
import type { Plan, PlanInterval, SubscriptionStatus } from "@/types";

const PLANS: Plan[] = ["free", "starter", "pro", "enterprise"];
const INTERVALS: PlanInterval[] = ["monthly", "quarterly", "yearly"];
const STATUSES: SubscriptionStatus[] = ["active", "trialing", "past_due", "paused", "canceled"];

type Body = {
  plan: Plan;
  plan_interval: PlanInterval | null;
  subscription_status: SubscriptionStatus | null;
  current_period_ends_at: string | null;
};

function validate(body: unknown): Body | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (typeof b.plan !== "string" || !PLANS.includes(b.plan as Plan)) return null;
  if (b.plan_interval !== null && !INTERVALS.includes(b.plan_interval as PlanInterval)) return null;
  if (b.subscription_status !== null && !STATUSES.includes(b.subscription_status as SubscriptionStatus)) return null;
  if (b.current_period_ends_at !== null && typeof b.current_period_ends_at !== "string") return null;
  return {
    plan: b.plan as Plan,
    plan_interval: (b.plan_interval as PlanInterval | null) ?? null,
    subscription_status: (b.subscription_status as SubscriptionStatus | null) ?? null,
    current_period_ends_at: (b.current_period_ends_at as string | null) ?? null,
  };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await requirePlatformAdmin();
  if ("error" in session) return session.error;

  const { id } = await params;
  const body = validate(await request.json().catch(() => null));
  if (!body) return jsonError("Invalid subscription payload", "invalid_body", 400);

  const admin = createAdminClient();

  // Previous status is needed to detect the access transition below -- same
  // reason app/api/webhooks/stripe/route.tsx selects before it updates.
  const { data: before, error: beforeErr } = await admin
    .from("merchants")
    .select("plan, plan_interval, subscription_status, current_period_ends_at")
    .eq("id", id)
    .single();
  if (beforeErr || !before) return jsonError("Merchant not found", "not_found", 404);

  const { error: updateErr } = await admin
    .from("merchants")
    .update({
      plan: body.plan,
      plan_interval: body.plan_interval,
      subscription_status: body.subscription_status,
      current_period_ends_at: body.current_period_ends_at,
    })
    .eq("id", id);
  if (updateErr) return jsonError("Update failed", "update_failed", 500);

  // Reuse the same enforce/restore logic the Stripe webhook already relies
  // on for this exact transition -- with one deliberate difference: this is
  // a considered admin action, not a payment failure, so a true->false
  // transition enforces immediately instead of starting a 3-day grace
  // window (startBillingGrace).
  const wasActive = hasActiveAccess(before.subscription_status);
  const isActive = hasActiveAccess(body.subscription_status);
  if (wasActive && !isActive) {
    await enforceBillingLimits(id);
  } else if (!wasActive && isActive) {
    await restoreBillingLimits(admin, id);
  }

  await admin.from("billing_events").insert({
    provider: "manual",
    event_id: crypto.randomUUID(),
    event_type: "admin_subscription_update",
    merchant_id: id,
    payload: { admin_email: session.email, before, after: body },
  });

  return jsonOk({ ok: true });
}
