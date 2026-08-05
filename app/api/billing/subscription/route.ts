import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { PADDLE_PRICE_ENV, PLAN_PRICES_USD_CENTS, paddlePriceId, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";
import { createPaddleClient } from "@/lib/paddle";

/**
 * Switches an EXISTING Paddle subscription to a different plan/interval.
 * Not used for a merchant's first subscription — that's created client-side
 * via Paddle.Checkout.open() (see billing-content.tsx), which is the only
 * way to collect a first payment method. This route only ever replaces the
 * item on a subscription that already has one.
 */
export async function PATCH(request: Request) {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const plan = body?.plan as PaidPlan | undefined;
  const interval = body?.interval as PlanInterval | undefined;

  if (!plan || !(plan in PADDLE_PRICE_ENV) || !interval || !(interval in PADDLE_PRICE_ENV.starter)) {
    return jsonError("Invalid plan or interval", "validation_error", 400);
  }

  const { merchant } = auth;
  if (!merchant.paddle_subscription_id || !merchant.subscription_status || merchant.subscription_status === "canceled") {
    return jsonError("No active subscription to update — use checkout to subscribe", "no_subscription", 409);
  }

  const newPriceId = paddlePriceId(plan, interval);
  if (!newPriceId) {
    return jsonError("That plan is not configured for checkout", "misconfigured", 503);
  }

  // Upgrading in price bills the difference now; a lateral/downgrade move
  // waits for the next renewal rather than issuing a mid-period refund —
  // see the subscription-update skill's proration guidance.
  const currentCents =
    merchant.plan in PLAN_PRICES_USD_CENTS && merchant.plan_interval
      ? PLAN_PRICES_USD_CENTS[merchant.plan as PaidPlan]?.[merchant.plan_interval]
      : undefined;
  const newCents = PLAN_PRICES_USD_CENTS[plan][interval];
  const isUpgrade = currentCents === undefined || newCents > currentCents;

  try {
    const paddle = createPaddleClient();
    const subscription = await paddle.subscriptions.update(merchant.paddle_subscription_id, {
      items: [{ priceId: newPriceId, quantity: 1 }],
      prorationBillingMode: isUpgrade ? "prorated_immediately" : "prorated_next_billing_period",
    });

    // The webhook (source of truth) syncs merchants.plan/plan_interval
    // asynchronously — this response just confirms Paddle accepted the
    // change request, not that billing has settled.
    return jsonOk({ status: subscription.status });
  } catch (err) {
    console.error("Paddle subscription update failed:", err);
    return jsonError("Could not update your subscription", "paddle_error", 502);
  }
}

/** Schedules cancellation for the end of the current billing period — the
 * merchant keeps paid access through what they've already paid for. */
export async function DELETE() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const { merchant } = auth;
  if (!merchant.paddle_subscription_id || !merchant.subscription_status || merchant.subscription_status === "canceled") {
    return jsonError("No active subscription to cancel", "no_subscription", 409);
  }

  try {
    const paddle = createPaddleClient();
    const subscription = await paddle.subscriptions.cancel(merchant.paddle_subscription_id, {
      effectiveFrom: "next_billing_period",
    });

    return jsonOk({
      status: subscription.status,
      scheduledCancelAt: subscription.scheduledChange?.effectiveAt ?? null,
    });
  } catch (err) {
    console.error("Paddle subscription cancel failed:", err);
    return jsonError("Could not cancel your subscription", "paddle_error", 502);
  }
}
