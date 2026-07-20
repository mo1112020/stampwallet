import { jsonError, jsonOk } from "@/lib/api";
import { isStripeConfigured } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStripeClient } from "@/lib/stripe";
import type Stripe from "stripe";

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

  if (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.updated"
  ) {
    const obj = event.data.object as Stripe.Checkout.Session | Stripe.Subscription;
    const merchantId =
      "metadata" in obj ? (obj.metadata?.merchant_id as string | undefined) : undefined;
    const plan =
      "metadata" in obj ? (obj.metadata?.plan as string | undefined) : undefined;

    if (merchantId && plan) {
      await admin.from("merchants").update({ plan }).eq("id", merchantId);
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    await admin
      .from("merchants")
      .update({ plan: "free" })
      .eq("stripe_customer_id", customerId);
  }

  return jsonOk({ received: true });
}
