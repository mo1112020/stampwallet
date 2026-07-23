import { createStripeClient } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Merchant } from "@/types";

export async function countSeats(merchantId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("staff_accounts")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .neq("status", "revoked");
  return (count ?? 0) + 1; // +1 for the owner's own seat
}

/**
 * Best-effort — called after a staff invite/revoke to keep the Stripe
 * subscription's line-item quantity matching actual seat count. Never
 * throws: a Stripe hiccup here shouldn't fail the staff mutation that
 * triggered it, same resilience pattern as lib/wallet/push.ts.
 */
export async function syncSeatQuantity(merchant: Pick<Merchant, "id" | "stripe_subscription_item_id">) {
  if (!isStripeConfigured() || !merchant.stripe_subscription_item_id) return;

  try {
    const seatCount = await countSeats(merchant.id);
    const stripe = createStripeClient();
    await stripe.subscriptionItems.update(merchant.stripe_subscription_item_id, {
      quantity: seatCount,
    });
  } catch (err) {
    console.error("[billing] failed to sync seat quantity for", merchant.id, err);
  }
}
