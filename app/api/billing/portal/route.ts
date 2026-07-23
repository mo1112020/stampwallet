import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { isStripeConfigured } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe";

export async function POST() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  if (!isStripeConfigured()) {
    return jsonError("Stripe is not configured yet.", "stripe_not_configured", 503);
  }

  if (!auth.merchant.stripe_customer_id) {
    return jsonError("No Stripe customer on file", "no_customer", 400);
  }

  const stripe = createStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const locale = auth.merchant.locale_default || "en";

  const session = await stripe.billingPortal.sessions.create({
    customer: auth.merchant.stripe_customer_id,
    return_url: `${appUrl}/${locale}/dashboard/billing`,
  });

  return jsonOk({ url: session.url });
}
