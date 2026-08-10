import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { PLAN_PRICES_USD_CENTS, STRIPE_PRICE_ENV, stripePriceId, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe";
import { sendTransactionalEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { PlanChangedEmail } from "@/components/emails/plan-changed";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

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

    const previousPlan = merchant.plan;
    const subscription = await stripe.subscriptions.update(merchant.stripe_subscription_id, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: isUpgrade ? "create_prorations" : "none",
    });

    if (previousPlan !== plan) {
      const { data: userData } = await createAdminClient().auth.admin.getUserById(merchant.id);
      const recipientEmail = userData?.user?.email;
      if (recipientEmail) {
        // Keyed on (subscription, new price) rather than a timestamp: a
        // double-submit of the exact same change (double-click, retry) must
        // not send two emails. The tradeoff is a genuine switch away and
        // immediately back to a plan already seen on this subscription won't
        // re-notify — accepted deliberately, since under-notifying a rare
        // toggle-back beats ever duplicate-notifying a double-click.
        // Awaited (not fire-and-forget) — a serverless function can freeze
        // before an un-awaited promise finishes once the response is sent.
        // sendTransactionalEmail never throws on a Resend failure, so this
        // can't turn an already-successful plan change into an error.
        await sendTransactionalEmail({
          idempotencyKey: `plan_changed:${merchant.stripe_subscription_id}:${newPriceId}`,
          emailType: "plan_changed",
          to: recipientEmail,
          subject: `Your WalletOS plan is now ${plan}`,
          react: (
            <PlanChangedEmail
              businessName={merchant.business_name}
              fromPlan={previousPlan}
              toPlan={plan}
              isUpgrade={isUpgrade}
              dashboardUrl={`${appUrl()}/${merchant.locale_default}/dashboard/billing`}
            />
          ),
          userId: merchant.id,
          merchantId: merchant.id,
        });
      }
    }

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
