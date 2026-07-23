import { createAdminClient } from "@/lib/supabase/admin";
import { renderPassFields } from "@/lib/wallet/renderPassFields";
import { triggerAutomatedNotification, recentlyNotifiedForTrigger } from "@/lib/notifications/campaigns";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";

const INACTIVE_DAYS_DEFAULT = 30;
const INACTIVE_DEDUP_DAYS = 14;
const EXPIRING_STALE_DAYS = 3;
const EXPIRING_DEDUP_DAYS = 7;
const BIRTHDAY_DEDUP_DAYS = 300;

/**
 * Evaluates birthday / expiring_reward / inactive_customer for every
 * merchant with the relevant notification_prefs toggle on. Called from the
 * daily cron (app/api/cron/notifications). reward_unlocked is NOT here —
 * it fires immediately from app/api/scan/route.ts, not on a daily sweep.
 *
 * "Expiring reward" is approximated (no expiry date/timestamp exists
 * anywhere in the schema): a reward that's been available and unredeemed
 * for a few days. If reward expiry becomes a real product feature, this is
 * where a real deadline check replaces the approximation.
 *
 * Iterates every merchant/customer_progress row per run — fine at MVP
 * scale; batch/paginate if this becomes a real bottleneck.
 */
export async function evaluateAutomatedTriggers(): Promise<{ evaluated: number; sent: number }> {
  const admin = createAdminClient();
  let evaluated = 0;
  let sent = 0;

  const { data: merchants } = await admin.from("merchants").select("*");

  for (const merchant of (merchants ?? []) as Merchant[]) {
    const prefs = merchant.notification_prefs ?? {};
    if (!prefs.birthday && !prefs.expiring_reward && !prefs.inactive_customer) continue;

    const { data: programs } = await admin
      .from("loyalty_programs")
      .select("*")
      .eq("merchant_id", merchant.id)
      .eq("is_active", true);
    const programById = new Map(((programs ?? []) as LoyaltyProgram[]).map((p) => [p.id, p]));
    const programIds = [...programById.keys()];
    if (programIds.length === 0) continue;

    const { data: progressRows } = await admin
      .from("customer_progress")
      .select("id, pass_id, program_id, progress, google_object_id, updated_at, customers(name, birthday)")
      .in("program_id", programIds);

    for (const row of progressRows ?? []) {
      evaluated++;
      const program = programById.get(row.program_id as string);
      if (!program) continue;

      const progress = row.progress as Progress;
      const target = {
        customerProgressId: row.id as string,
        passId: row.pass_id as string,
        googleObjectId: row.google_object_id as string | null,
        program,
        merchant,
        progress,
      };
      const customer = row.customers as unknown as { name: string | null; birthday: string | null } | null;
      const updatedAt = new Date(row.updated_at as string);

      if (prefs.birthday && customer?.birthday) {
        const today = new Date();
        const bday = new Date(customer.birthday);
        if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
          const dup = await recentlyNotifiedForTrigger(
            merchant.id,
            "birthday",
            target.customerProgressId,
            BIRTHDAY_DEDUP_DAYS
          );
          if (!dup) {
            await triggerAutomatedNotification({
              trigger: "birthday",
              title: "Happy Birthday!",
              message: `🎂 Happy Birthday${customer.name ? `, ${customer.name}` : ""}! Enjoy a treat on us.`,
              target,
            });
            sent++;
          }
        }
      }

      if (prefs.expiring_reward) {
        const fields = renderPassFields(program.type, program.config, progress, merchant.business_name);
        const staleCutoff = new Date();
        staleCutoff.setDate(staleCutoff.getDate() - EXPIRING_STALE_DAYS);
        if (fields.rewardAvailable && updatedAt < staleCutoff) {
          const dup = await recentlyNotifiedForTrigger(
            merchant.id,
            "expiring_reward",
            target.customerProgressId,
            EXPIRING_DEDUP_DAYS
          );
          if (!dup) {
            await triggerAutomatedNotification({
              trigger: "expiring_reward",
              title: "Reward waiting",
              message: "🎁 You have a reward ready to redeem — don't forget to come claim it!",
              target,
            });
            sent++;
          }
        }
      }

      if (prefs.inactive_customer) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - INACTIVE_DAYS_DEFAULT);
        if (updatedAt < cutoff) {
          const dup = await recentlyNotifiedForTrigger(
            merchant.id,
            "inactive_customer",
            target.customerProgressId,
            INACTIVE_DEDUP_DAYS
          );
          if (!dup) {
            await triggerAutomatedNotification({
              trigger: "inactive_customer",
              title: "We miss you!",
              message: "We haven't seen you in a while — come back for your rewards!",
              target,
            });
            sent++;
          }
        }
      }
    }
  }

  return { evaluated, sent };
}
