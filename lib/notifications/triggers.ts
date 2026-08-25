import { createAdminClient } from "@/lib/supabase/admin";
import { renderPassFields } from "@/lib/wallet/renderPassFields";
import { triggerAutomatedNotification, recentlyNotifiedForTrigger } from "@/lib/notifications/campaigns";
import { processInBatches } from "@/lib/concurrency";
import type { LoyaltyProgram, Merchant, Progress } from "@/types";

const INACTIVE_DAYS_DEFAULT = 30;
const INACTIVE_DEDUP_DAYS = 14;
const EXPIRING_STALE_DAYS = 3;
const EXPIRING_DEDUP_DAYS = 7;
const BIRTHDAY_DEDUP_DAYS = 300;
const DEFAULT_BIRTHDAY_MESSAGE = "🎂 Happy Birthday {name}! Enjoy a treat on us.";

/** Substitutes the literal `{name}` token a merchant's custom message (or
 * the default) may contain — including any single space directly before it,
 * so a missing name collapses cleanly ("Happy Birthday!") instead of leaving
 * a dangling double space ("Happy Birthday !"). */
function renderBirthdayMessage(template: string, customerName: string | null): string {
  const name = customerName?.trim();
  return template.replace(/\s?\{name\}/g, name ? ` ${name}` : "").replace(/\s{2,}/g, " ").trim();
}

type PendingEvaluation = {
  merchant: Merchant;
  program: LoyaltyProgram;
  row: {
    id: string;
    pass_id: string;
    program_id: string;
    progress: Progress;
    google_object_id: string | null;
    updated_at: string;
    created_at: string;
    customers: { name: string | null; birthday: string | null } | null;
  };
};

/** One row's birthday/expiring_reward/inactive_customer checks — the actual
 * network-bound work (dedup lookups + wallet pushes), run per item inside
 * the batched fan-out below. Returns how many notifications it actually
 * sent (0-3) so the caller can total them up. */
async function evaluateOne(merchant: Merchant, program: LoyaltyProgram, row: PendingEvaluation["row"]): Promise<number> {
  const prefs = merchant.notification_prefs ?? {};
  const progress = row.progress;
  const target = {
    customerProgressId: row.id,
    passId: row.pass_id,
    googleObjectId: row.google_object_id,
    program,
    merchant,
    progress,
    enrolledAt: row.created_at,
  };
  const customer = row.customers;
  const updatedAt = new Date(row.updated_at);
  let sent = 0;

  if (prefs.birthday && customer?.birthday) {
    const today = new Date();
    const bday = new Date(customer.birthday);
    if (bday.getMonth() === today.getMonth() && bday.getDate() === today.getDate()) {
      const dup = await recentlyNotifiedForTrigger(merchant.id, "birthday", target.customerProgressId, BIRTHDAY_DEDUP_DAYS);
      if (!dup) {
        await triggerAutomatedNotification({
          trigger: "birthday",
          title: "Happy Birthday!",
          message: renderBirthdayMessage(prefs.birthday_message?.trim() || DEFAULT_BIRTHDAY_MESSAGE, customer.name),
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
      const dup = await recentlyNotifiedForTrigger(merchant.id, "expiring_reward", target.customerProgressId, EXPIRING_DEDUP_DAYS);
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
      const dup = await recentlyNotifiedForTrigger(merchant.id, "inactive_customer", target.customerProgressId, INACTIVE_DEDUP_DAYS);
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

  return sent;
}

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
 * The DB reads (every merchant, every active program, every customer_progress
 * row) stay a plain sequential loop — cheap Supabase queries, not the
 * bottleneck. What used to also run serially was the actual notification
 * work (a dedup lookup plus a wallet push per matching row) — for a
 * merchant with a large, long-standing customer base that's the expensive
 * part, and doing it one row at a time risked running out the request's
 * time budget partway through a merchant's list. That part is now
 * flattened across every merchant/row up front and fanned out in batches
 * (see lib/concurrency.ts).
 */
export async function evaluateAutomatedTriggers(): Promise<{ evaluated: number; sent: number; failed: number }> {
  const admin = createAdminClient();
  const pending: PendingEvaluation[] = [];

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
      .select("id, pass_id, program_id, progress, google_object_id, updated_at, created_at, customers(name, birthday)")
      .in("program_id", programIds);

    for (const row of progressRows ?? []) {
      const program = programById.get(row.program_id as string);
      if (!program) continue;
      pending.push({
        merchant,
        program,
        row: row as unknown as PendingEvaluation["row"],
      });
    }
  }

  let sent = 0;
  const batchResult = await processInBatches(pending, async ({ merchant, program, row }) => {
    sent += await evaluateOne(merchant, program, row);
  });

  if (batchResult.failed > 0) {
    console.error(
      `[notifications:triggers] ${batchResult.failed}/${pending.length} row evaluations failed`,
      batchResult.errors.map((e) => (e.error instanceof Error ? e.error.message : e.error))
    );
  }

  return { evaluated: pending.length, sent, failed: batchResult.failed };
}
