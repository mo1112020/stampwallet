import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { hasActiveAccess } from "@/lib/billing/access";
import { STRIPE_PRICE_ENV, stripePriceId, type PaidPlan, type PlanInterval } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe";
import { getAuthUser } from "@/lib/supabase/server";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Creates a secure server-side Stripe Checkout Session for a merchant's
 * FIRST subscription. Not used for plan switches on an existing
 * subscription — see PATCH /api/billing/subscription, which is the only
 * way to change an active subscription's price. The merchant/customer
 * link is carried both on the Checkout Session and the resulting
 * subscription (metadata.merchant_id) so the webhook can resolve it even
 * if it only ever sees the subscription events, never this session.
 */
export async function POST(request: Request) {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => null);
  const plan = body?.plan as PaidPlan | undefined;
  const interval = body?.interval as PlanInterval | undefined;

  if (!plan || !(plan in STRIPE_PRICE_ENV) || !interval || !(interval in STRIPE_PRICE_ENV.starter)) {
    return jsonError("Invalid plan or interval", "validation_error", 400);
  }

  const { merchant } = auth;

  // Prevent duplicate subscriptions — a merchant with active paid access
  // should switch plans (PATCH /api/billing/subscription) or manage from
  // the billing portal, not spin up a second Stripe subscription.
  if (hasActiveAccess(merchant.subscription_status)) {
    return jsonError(
      "You already have an active subscription — use the plan switcher or billing portal instead",
      "already_subscribed",
      409
    );
  }

  const priceId = stripePriceId(plan, interval);
  if (!priceId) {
    return jsonError("That plan is not configured for checkout", "misconfigured", 503);
  }

  const user = await getAuthUser();
  const billingUrl = `${appUrl()}/${merchant.locale_default}/dashboard/billing`;

  try {
    const stripe = createStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      // Reuse the existing Stripe customer once one exists (e.g. a
      // previously-canceled subscriber resubscribing) rather than letting
      // Stripe silently create a second customer record for the same
      // merchant — customer_email is only a fallback for a merchant who has
      // never checked out before.
      ...(merchant.stripe_customer_id ? { customer: merchant.stripe_customer_id } : user?.email ? { customer_email: user.email } : {}),
      client_reference_id: merchant.id,
      metadata: { merchant_id: merchant.id },
      subscription_data: { metadata: { merchant_id: merchant.id } },
      success_url: `${billingUrl}?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${billingUrl}?checkout=canceled`,
    });

    if (!session.url) {
      return jsonError("Could not start checkout", "stripe_error", 502);
    }

    return jsonOk({ url: session.url });
  } catch (err) {
    console.error("Stripe checkout session failed:", err);
    return jsonError("Could not start checkout", "stripe_error", 502);
  }
}
