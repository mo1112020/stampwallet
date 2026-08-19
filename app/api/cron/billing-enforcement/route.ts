import { jsonError, jsonOk } from "@/lib/api";
import { sweepExpiredBillingGrace } from "@/lib/billing/enforcement";

// Bounded by how many merchants are actively past their grace period at
// once, not overall customer count — set for consistency/headroom, not
// because this one has been observed running long.
export const maxDuration = 60;

/**
 * Runs daily via Vercel Cron (see vercel.json) — finds every merchant whose
 * post-cancellation grace period (see lib/billing/enforcement.ts,
 * startBillingGrace) has passed and enforces their plan's actual limits:
 * pauses excess programs/locations, suspends staff beyond the Free seat
 * limit, and caps live wallet updates. Kept as its own cron/route rather
 * than folded into /api/cron/notifications or /api/cron/email-engagement —
 * this one mutates billing-driven access state, a different concern from
 * either of those.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return jsonError("Unauthorized", "unauthorized", 401);
  }

  const results = await sweepExpiredBillingGrace();
  return jsonOk(results);
}
