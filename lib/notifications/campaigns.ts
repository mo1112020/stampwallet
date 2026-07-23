import { createAdminClient } from "@/lib/supabase/admin";
import { pushWalletUpdate } from "@/lib/wallet/push";
import { isAppleWalletConfigured } from "@/lib/wallet/apple";
import { isGoogleWalletConfigured } from "@/lib/wallet/google";
import { resolveSegmentTargets, type NotificationTarget } from "@/lib/notifications/segments";
import type { NotificationTrigger } from "@/types";

/**
 * Delivers one message to one pass: persists it (so it survives beyond the
 * single push, embedded on the pass itself — see lib/wallet/apple.ts's
 * latestNotificationMessage / google.ts's messages array) and triggers the
 * wallet push, then logs the attempt. This is the wallet-native delivery
 * layer the owner asked for — no email/SMS/separate app.
 */
async function deliverToTarget(
  campaignId: string,
  title: string,
  message: string,
  target: NotificationTarget
) {
  const admin = createAdminClient();

  await admin
    .from("customer_progress")
    .update({ latest_notification_message: message })
    .eq("id", target.customerProgressId);

  await pushWalletUpdate({
    passId: target.passId,
    googleObjectId: target.googleObjectId,
    program: target.program,
    merchant: target.merchant,
    progress: target.progress,
    notification: { title, message },
  });

  const configured = isAppleWalletConfigured() || isGoogleWalletConfigured();

  await admin.from("notification_sends").insert({
    campaign_id: campaignId,
    customer_progress_id: target.customerProgressId,
    platform: "both",
    status: configured ? "sent" : "stubbed",
    message,
    sent_at: new Date().toISOString(),
  });
}

/**
 * Automated triggers create their own campaign row per firing event (one
 * customer each) rather than reusing a persistent per-trigger campaign —
 * keeps notification_sends' (campaign_id, customer_progress_id) unique
 * constraint meaningful (a manual/scheduled blast shouldn't double-send to
 * the same customer; a recurring automation firing again for the same
 * customer later is a new event, not a duplicate).
 */
export async function triggerAutomatedNotification(params: {
  trigger: NotificationTrigger;
  title: string;
  message: string;
  target: NotificationTarget;
}) {
  const admin = createAdminClient();

  const { data: campaign, error } = await admin
    .from("notification_campaigns")
    .insert({
      merchant_id: params.target.merchant.id,
      type: "automated",
      trigger: params.trigger,
      program_id: params.target.program.id,
      title: params.title,
      message: params.message,
      status: "sent",
    })
    .select("*")
    .single();

  if (error || !campaign) {
    console.error("[notifications] failed to create automated campaign", error);
    return;
  }

  await deliverToTarget(campaign.id, params.title, params.message, params.target);
}

/** Was this specific pass already notified for this trigger within the
 * dedup window? Prevents a daily cron from re-notifying the same customer
 * every single day they continue to match (e.g. still inactive). */
export async function recentlyNotifiedForTrigger(
  merchantId: string,
  trigger: NotificationTrigger,
  customerProgressId: string,
  withinDays: number
): Promise<boolean> {
  const admin = createAdminClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - withinDays);

  const { data: campaigns } = await admin
    .from("notification_campaigns")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("trigger", trigger)
    .gte("created_at", cutoff.toISOString());

  const campaignIds = (campaigns ?? []).map((c) => c.id as string);
  if (campaignIds.length === 0) return false;

  const { data: sends } = await admin
    .from("notification_sends")
    .select("id")
    .in("campaign_id", campaignIds)
    .eq("customer_progress_id", customerProgressId)
    .limit(1);

  return (sends ?? []).length > 0;
}

/** Manual/scheduled campaigns: one campaign row, fans out to every target
 * in its segment. */
export async function sendCampaignNow(campaignId: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("notification_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (!campaign) throw new Error("Campaign not found");

  await admin.from("notification_campaigns").update({ status: "sending" }).eq("id", campaignId);

  const targets = await resolveSegmentTargets(campaign.merchant_id, campaign.segment);

  for (const target of targets) {
    try {
      await deliverToTarget(campaignId, campaign.title, campaign.message, target);
    } catch (err) {
      console.error("[notifications] send failed for", target.customerProgressId, err);
      await admin.from("notification_sends").insert({
        campaign_id: campaignId,
        customer_progress_id: target.customerProgressId,
        platform: "both",
        status: "failed",
        message: campaign.message,
        error: err instanceof Error ? err.message : "Unknown error",
      });
    }
  }

  await admin.from("notification_campaigns").update({ status: "sent" }).eq("id", campaignId);
}
