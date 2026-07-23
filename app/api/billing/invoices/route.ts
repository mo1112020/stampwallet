import { jsonOk, requireCapability } from "@/lib/api";
import { isStripeConfigured } from "@/lib/billing/plans";
import { createStripeClient } from "@/lib/stripe";

export async function GET() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  if (!isStripeConfigured() || !auth.merchant.stripe_customer_id) {
    return jsonOk([]);
  }

  const stripe = createStripeClient();
  const invoices = await stripe.invoices.list({
    customer: auth.merchant.stripe_customer_id,
    limit: 12,
  });

  return jsonOk(
    invoices.data.map((inv) => ({
      id: inv.id,
      amount_paid: inv.amount_paid,
      currency: inv.currency,
      status: inv.status,
      created: inv.created,
      hosted_invoice_url: inv.hosted_invoice_url,
    }))
  );
}
