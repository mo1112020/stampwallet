import { jsonError, jsonOk } from "@/lib/api";
import { isStripeConfigured, PLAN_LIMITS, STRIPE_PRICE_ENV } from "@/lib/billing/plans";
import { disableCardExpirationForMerchant } from "@/lib/billing/enforcement";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import type Stripe from "stripe";

/** Derives our plan key from the actual Stripe price id on a subscription
 * item — the source of truth for plan-switches made via the Stripe
 * Customer Portal, which don't carry our checkout session's metadata. */
function planForPriceId(priceId: string | undefined): "starter" | "pro" | null {
  if (!priceId) return null;
  for (const [plan, envVar] of Object.entries(STRIPE_PRICE_ENV)) {
    if (process.env[envVar] === priceId) return plan as "starter" | "pro";
  }
  return null;
}

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    return jsonError("Stripe is not configured yet.", "stripe_not_configured", 503);
  }

  const stripe = createStripeClient();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return jsonError("Missing webhook signature config", "misconfigured", 503);
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch (err) {
    return jsonError((err as Error).message, "invalid_signature", 400);
  }

  const admin = createAdminClient();

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const merchantId = session.metadata?.merchant_id;
    const plan = session.metadata?.plan;
    const subscriptionId =
      typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

    if (merchantId && plan) {
      await admin.from("merchants").update({ plan }).eq("id", merchantId);
    }

    // Capture the subscription item id so future staff invites/revokes can
    // keep its quantity in sync with actual seat count (see lib/stripe/seats.ts).
    if (merchantId && subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      const itemId = subscription.items.data[0]?.id;
      if (itemId) {
        await admin.from("merchants").update({ stripe_subscription_item_id: itemId }).eq("id", merchantId);
      }
    }
  }

  if (event.type === "customer.subscription.updated") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const item = sub.items.data[0];
    const plan = planForPriceId(item?.price.id);

    const update: Record<string, string> = {};
    if (plan) update.plan = plan;
    if (item?.id) update.stripe_subscription_item_id = item.id;

    if (Object.keys(update).length > 0) {
      await admin.from("merchants").update(update).eq("stripe_customer_id", customerId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const { data: merchant } = await admin
      .from("merchants")
      .update({ plan: "free" })
      .eq("stripe_customer_id", customerId)
      .select("id")
      .maybeSingle();

    // Free plan doesn't include card expiration — switch it off wherever a
    // merchant had it enabled rather than leaving a paid feature running.
    if (merchant && !PLAN_LIMITS.free.cardExpiration) {
      await disableCardExpirationForMerchant(admin, merchant.id);
    }
  }

  return jsonOk({ received: true });
}
