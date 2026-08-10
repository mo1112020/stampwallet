import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { PLAN_PRICES_USD_CENTS, STRIPE_PRICE_ENV, stripePriceId, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe";

/**
 * Switches an EXISTING Stripe subscription to a different plan/interval.
 * Not used for a merchant's first subscription — that's created via
 * POST /api/billing/checkout, which is the only way to collect a first
 * payment method. This route only ever replaces the price on an item that
 * already exists.
 */
export async function PATCH(request: Request) {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const plan = body?.plan as PaidPlan | undefined;
  const interval = body?.interval as PlanInterval | undefined;

  if (!plan || !(plan in STRIPE_PRICE_ENV) || !interval || !(interval in STRIPE_PRICE_ENV.starter)) {
    return jsonError("Invalid plan or interval", "validation_error", 400);
  }

  const { merchant } = auth;
  if (!merchant.stripe_subscription_id || !merchant.subscription_status || merchant.subscription_status === "canceled") {
    return jsonError("No active subscription to update — use checkout to subscribe", "no_subscription", 409);
  }

  const newPriceId = stripePriceId(plan, interval);
  if (!newPriceId) {
    return jsonError("That plan is not configured for checkout", "misconfigured", 503);
  }

  // Upgrading bills the prorated difference now; a lateral/downgrade move
  // changes the price with no proration adjustment, so the merchant isn't
  // mid-period refunded — the lower rate simply applies from here on.
  const currentCents =
    merchant.plan in PLAN_PRICES_USD_CENTS && merchant.plan_interval
      ? PLAN_PRICES_USD_CENTS[merchant.plan as PaidPlan]?.[merchant.plan_interval]
      : undefined;
  const newCents = PLAN_PRICES_USD_CENTS[plan][interval];
  const isUpgrade = currentCents === undefined || newCents > currentCents;

  try {
    const stripe = createStripeClient();
    const current = await stripe.subscriptions.retrieve(merchant.stripe_subscription_id);
    const itemId = current.items.data[0]?.id;
    if (!itemId) {
      return jsonError("Could not locate your subscription item", "stripe_error", 502);
    }

    const subscription = await stripe.subscriptions.update(merchant.stripe_subscription_id, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: isUpgrade ? "create_prorations" : "none",
    });

    // The webhook (source of truth) syncs merchants.plan/plan_interval
    // asynchronously — this response just confirms Stripe accepted the
    // change request, not that billing has settled.
    return jsonOk({ status: subscription.status });
  } catch (err) {
    console.error("Stripe subscription update failed:", err);
    return jsonError("Could not update your subscription", "stripe_error", 502);
  }
}

/** Schedules cancellation for the end of the current billing period — the
 * merchant keeps paid access through what they've already paid for. */
export async function DELETE() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const { merchant } = auth;
  if (!merchant.stripe_subscription_id || !merchant.subscription_status || merchant.subscription_status === "canceled") {
    return jsonError("No active subscription to cancel", "no_subscription", 409);
  }

  try {
    const stripe = createStripeClient();
    const subscription = await stripe.subscriptions.update(merchant.stripe_subscription_id, {
      cancel_at_period_end: true,
    });

    const periodEnd = subscription.items.data[0]?.current_period_end;
    return jsonOk({
      status: subscription.status,
      scheduledCancelAt: subscription.cancel_at_period_end && periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    });
  } catch (err) {
    console.error("Stripe subscription cancel failed:", err);
    return jsonError("Could not cancel your subscription", "stripe_error", 502);
  }
}
