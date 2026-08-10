import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { createStripeClient } from "@/lib/stripe";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Mints a one-time Stripe billing portal session and returns only the
 * redirect URL. The customer id is resolved server-side from the
 * authenticated session (never from client input) — a portal session is a
 * key to that merchant's billing data, payment methods, and invoices, so
 * one merchant must never be able to request a portal session for another
 * merchant's Stripe customer.
 */
export async function POST() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const { merchant } = auth;
  if (!merchant.stripe_customer_id) {
    return jsonError("No Stripe customer yet — subscribe first", "no_customer", 409);
  }

  try {
    const stripe = createStripeClient();
    const session = await stripe.billingPortal.sessions.create({
      customer: merchant.stripe_customer_id,
      return_url: `${appUrl()}/${merchant.locale_default}/dashboard/billing`,
    });
    return jsonOk({ url: session.url });
  } catch (err) {
    console.error("Stripe portal session failed:", err);
    return jsonError("Could not open the billing portal", "stripe_error", 502);
  }
}
