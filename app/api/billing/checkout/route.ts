import { jsonError, jsonOk, requireMerchant } from "@/lib/api";
import { STRIPE_PRICE_ENV, isStripeConfigured } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe";
import { checkoutSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  if (!isStripeConfigured()) {
    return jsonError("Stripe is not configured yet.", "stripe_not_configured", 503);
  }

  const body = await request.json();
  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const priceEnv = STRIPE_PRICE_ENV[parsed.data.plan];
  const priceId = process.env[priceEnv];
  if (!priceId) {
    return jsonError(`Missing ${priceEnv}`, "stripe_not_configured", 503);
  }

  const stripe = createStripeClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const locale = auth.merchant.locale_default || "en";

  let customerId = auth.merchant.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (await auth.supabase.auth.getUser()).data.user?.email,
      metadata: { merchant_id: auth.userId },
    });
    customerId = customer.id;
    await auth.supabase
      .from("merchants")
      .update({ stripe_customer_id: customerId })
      .eq("id", auth.userId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${appUrl}/${locale}/dashboard/billing?success=1`,
    cancel_url: `${appUrl}/${locale}/dashboard/billing?canceled=1`,
    metadata: { merchant_id: auth.userId, plan: parsed.data.plan },
  });

  return jsonOk({ url: session.url });
}
