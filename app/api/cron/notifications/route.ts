import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCampaignNow } from "@/lib/notifications/campaigns";
import { evaluateAutomatedTriggers } from "@/lib/notifications/triggers";
import { refreshExpiringPasses } from "@/lib/wallet/expirationRefresh";

/**
 * Runs daily via Vercel Cron (see vercel.json). Three jobs:
 * 1. Send any "scheduled" campaigns whose time has come.
 * 2. Evaluate birthday / expiring_reward / inactive_customer for every
 *    merchant that has the relevant toggle on (reward_unlocked fires
 *    immediately from app/api/scan/route.ts instead, not here).
 * 3. Refresh wallet passes for programs with card expiration enabled, so
 *    the "N days remaining" field is accurate every day, not just after
 *    the customer's next scan.
 *
 * Requires CRON_SECRET so this can't be triggered by anyone who finds the
 * URL — Vercel Cron sends it as an Authorization: Bearer header when
 * configured.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return jsonError("Unauthorized", "unauthorized", 401);
  }

  const admin = createAdminClient();
  const { data: dueCampaigns } = await admin
    .from("notification_campaigns")
    .select("id")
    .eq("status", "scheduled")
    .lte("scheduled_for", new Date().toISOString());

  let campaignsSent = 0;
  for (const campaign of dueCampaigns ?? []) {
    try {
      await sendCampaignNow(campaign.id);
      campaignsSent++;
    } catch (err) {
      console.error("[cron:notifications] scheduled campaign failed", campaign.id, err);
    }
  }

  const triggerResult = await evaluateAutomatedTriggers();
  const expirationResult = await refreshExpiringPasses();

  return jsonOk({
    scheduled_campaigns_sent: campaignsSent,
    automated_triggers: triggerResult,
    expiring_passes_refreshed: expirationResult.refreshed,
  });
}
