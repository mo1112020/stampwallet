import { jsonError, jsonOk } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendCampaignNow } from "@/lib/notifications/campaigns";
import { evaluateAutomatedTriggers } from "@/lib/notifications/triggers";

/**
 * Runs daily via Vercel Cron (see vercel.json). Two jobs:
 * 1. Send any "scheduled" campaigns whose time has come.
 * 2. Evaluate birthday / expiring_reward / inactive_customer for every
 *    merchant that has the relevant toggle on (reward_unlocked fires
 *    immediately from app/api/scan/route.ts instead, not here).
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

  return jsonOk({
    scheduled_campaigns_sent: campaignsSent,
    automated_triggers: triggerResult,
  });
}
