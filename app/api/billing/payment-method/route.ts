import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { createPaddleClient } from "@/lib/paddle";

/**
 * Returns a Paddle transaction id for updating the card on file — the
 * client opens it with Paddle.Checkout.open({ transactionId }), same
 * checkout UI as a normal purchase but pre-loaded for a $0 payment-method
 * swap instead of a new charge.
 */
export async function POST() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const { merchant } = auth;
  if (!merchant.paddle_subscription_id) {
    return jsonError("No subscription to update a payment method for", "no_subscription", 409);
  }

  try {
    const paddle = createPaddleClient();
    const transaction = await paddle.subscriptions.getPaymentMethodChangeTransaction(merchant.paddle_subscription_id);
    return jsonOk({ transactionId: transaction.id });
  } catch (err) {
    console.error("Paddle payment-method transaction failed:", err);
    return jsonError("Could not start payment method update", "paddle_error", 502);
  }
}
