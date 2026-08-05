import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { createPaddleClient } from "@/lib/paddle";

/**
 * Mints a one-time, time-limited Paddle customer portal session and
 * returns only the redirect URL. The customer id is resolved server-side
 * from the authenticated session (never from client input) — a portal
 * session is a key to that merchant's billing data.
 */
export async function POST() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const { merchant } = auth;
  if (!merchant.paddle_customer_id) {
    return jsonError("No Paddle customer yet — subscribe first", "no_customer", 409);
  }

  try {
    const paddle = createPaddleClient();
    const subscriptionIds = merchant.paddle_subscription_id ? [merchant.paddle_subscription_id] : [];
    const session = await paddle.customerPortalSessions.create(merchant.paddle_customer_id, subscriptionIds);
    return jsonOk({ url: session.urls.general.overview });
  } catch (err) {
    console.error("Paddle portal session failed:", err);
    return jsonError("Could not open the billing portal", "paddle_error", 502);
  }
}
