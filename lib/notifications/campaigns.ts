import { createAdminClient } from "@/lib/supabase/admin";
import { pushWalletUpdate } from "@/lib/wallet/push";
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
  target: NotificationTarget,
  /** True for every caller except a reward_unlocked trigger fired right off
   * a scan (the one case where `target.progress` is genuinely fresh, not
   * just re-read from the DB) — see pushWalletUpdate's skipHeroImageRefresh
   * for what this actually skips and why. */
  skipHeroImageRefresh: boolean
) {
  const admin = createAdminClient();

  await admin
    .from("customer_progress")
    .update({ latest_notification_message: message })
    .eq("id", target.customerProgressId);

  const result = await pushWalletUpdate({
    passId: target.passId,
    googleObjectId: target.googleObjectId,
    program: target.program,
    merchant: target.merchant,
    progress: target.progress,
    notification: { title, message },
    enrolledAt: target.enrolledAt,
    skipHeroImageRefresh,
  });

  // Report against reality instead of "is Wallet configured at all" — that
  // used to mark every send "sent" even when the platform the customer
  // actually has installed genuinely failed to update, and could never
  // surface a real per-customer failure to the merchant.
  const applicablePlatforms = [
    result.apple.applicable ? "apple" : null,
    result.google.applicable ? "google" : null,
  ].filter((p): p is "apple" | "google" => p !== null);
  const platform = applicablePlatforms.length === 2 ? "both" : applicablePlatforms[0] ?? "both";
  const failed =
    (result.apple.applicable && !result.apple.ok) || (result.google.applicable && !result.google.ok);
  const status = applicablePlatforms.length === 0 ? "stubbed" : failed ? "failed" : "sent";

  // upsert, not insert: sendCampaignNow pre-creates a "queued" row per target
  // (see below) so the campaign's recipient list — and each customer's live
  // status — is visible in the UI before delivery finishes, not just after.
  await admin.from("notification_sends").upsert(
    {
      campaign_id: campaignId,
      customer_progress_id: target.customerProgressId,
      platform,
      status,
      message,
      error: failed
        ? [
            result.apple.applicable && !result.apple.ok ? "Apple Wallet push failed" : null,
            result.google.applicable && !result.google.ok ? "Google Wallet push failed" : null,
          ]
            .filter(Boolean)
            .join("; ")
        : null,
      sent_at: new Date().toISOString(),
    },
    { onConflict: "campaign_id,customer_progress_id" }
  );
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
  /** Defaults to true (skip the hero-image regen) — right for every
   * cron-driven trigger (birthday/expiring_reward/inactive_customer:
   * lib/notifications/triggers.ts, always stale-progress). The one
   * exception is reward_unlocked, fired directly from app/api/scan/route.ts
   * with progress that just genuinely changed — that call site passes
   * `false` explicitly. */
  skipHeroImageRefresh?: boolean;
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

  await deliverToTarget(campaign.id, params.title, params.message, params.target, params.skipHeroImageRefresh ?? true);
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

/** Bounds one target's delivery so a single hung wallet-platform request
 * (Apple/Google network calls, image generation/upload, etc.) can't wedge
 * the whole sequential loop below forever — the individual network calls
 * inside the push path already have their own timeouts, but this is a
 * structural backstop: whatever misbehaves next still can't block the rest
 * of the campaign from being attempted. */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

/** Manual/scheduled campaigns: one campaign row, fans out to every target
 * in its segment.
 *
 * Always resolves to a terminal status ("sent" or "failed") via the
 * try/catch below — previously a throw between marking "sending" and the
 * final update (e.g. resolveSegmentTargets erroring, or the caller's
 * execution getting cut short) left the campaign stuck on "sending"
 * forever, with no status this function could ever move it out of and no
 * way for the merchant to retry or cancel it. */
export async function sendCampaignNow(campaignId: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from("notification_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (!campaign) throw new Error("Campaign not found");

  await admin.from("notification_campaigns").update({ status: "sending" }).eq("id", campaignId);

  try {
    const targets = await resolveSegmentTargets(campaign.merchant_id, campaign.segment);

    // Pre-register every target as "queued" up front so the campaign's
    // recipient count and per-customer progress are visible immediately,
    // instead of only appearing one row at a time as each delivery finishes.
    if (targets.length > 0) {
      await admin.from("notification_sends").upsert(
        targets.map((target) => ({
          campaign_id: campaignId,
          customer_progress_id: target.customerProgressId,
          platform: "both" as const,
          status: "queued" as const,
          message: campaign.message,
        })),
        { onConflict: "campaign_id,customer_progress_id", ignoreDuplicates: true }
      );
    }

    for (const target of targets) {
      try {
        await withTimeout(
          // A manual/scheduled campaign never carries fresh progress — always
          // skip the hero-image regen.
          deliverToTarget(campaignId, campaign.title, campaign.message, target, true),
          // See lib/wallet/push.ts's pushProgramUpdateToAllCustomers for why
          // this is 45s and not 25s — Google's push does real image work
          // Apple's doesn't, and 25s was tight enough to read as "Android
          // notifications always fail" when it was actually timing out.
          45000,
          `delivery to ${target.customerProgressId}`
        );
      } catch (err) {
        console.error("[notifications] send failed for", target.customerProgressId, err);
        await admin.from("notification_sends").upsert(
          {
            campaign_id: campaignId,
            customer_progress_id: target.customerProgressId,
            platform: "both",
            status: "failed",
            message: campaign.message,
            error: err instanceof Error ? err.message : "Unknown error",
          },
          { onConflict: "campaign_id,customer_progress_id" }
        );
      }
    }

    await admin.from("notification_campaigns").update({ status: "sent" }).eq("id", campaignId);
  } catch (err) {
    console.error("[notifications] campaign failed", campaignId, err);
    await admin.from("notification_campaigns").update({ status: "failed" }).eq("id", campaignId);
    throw err;
  }
}
