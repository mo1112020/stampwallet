import { jsonError, jsonOk } from "@/lib/api";
import { evaluateEmailEngagementTriggers } from "@/lib/email/triggers";

/**
 * Runs daily via Vercel Cron (see vercel.json) — the onboarding/
 * re-engagement email sequence: verification reminders, "create your first
 * program" nudges, upgrade prompts, and inactivity re-engagement. Kept as
 * its own cron/route rather than folded into /api/cron/notifications —
 * that one drives wallet-push sends (a different channel/concern
 * entirely, see 011_notifications.sql), this one drives email.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return jsonError("Unauthorized", "unauthorized", 401);
  }

  const results = await evaluateEmailEngagementTriggers();
  return jsonOk(results);
}
