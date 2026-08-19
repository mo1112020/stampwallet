import { createAdminClient } from "@/lib/supabase/admin";
import { pushWalletUpdate } from "@/lib/wallet/push";
import { processInBatches } from "@/lib/concurrency";
import type { CardAppearance, LoyaltyProgram, Merchant, Progress } from "@/types";

type PendingRefresh = {
  loyaltyProgram: LoyaltyProgram;
  merchant: Merchant;
  row: { pass_id: string; google_object_id: string | null; progress: Progress; created_at: string };
};

/** Refreshes wallet passes for every active program with card expiration
 * enabled, so the "N days remaining" text (and Apple/Google's native
 * expiration date) stays accurate day to day without waiting for the
 * customer's next scan. Runs from the daily notifications cron.
 *
 * The DB reads (every program, then every enrolled customer_progress row)
 * stay a plain sequential loop; the actual wallet pushes — the expensive,
 * network-bound part — are flattened across every program up front and
 * fanned out in batches (see lib/concurrency.ts) instead of one at a time,
 * for the same reason lib/notifications/triggers.ts does. */
export async function refreshExpiringPasses() {
  const admin = createAdminClient();

  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("*, merchants(*)")
    .eq("is_active", true);

  const expiringPrograms = (programs ?? []).filter(
    (p) => (p.config as CardAppearance).expiration?.enabled
  );
  if (expiringPrograms.length === 0) return { refreshed: 0, failed: 0 };

  const pending: PendingRefresh[] = [];

  for (const program of expiringPrograms) {
    const merchant = program.merchants as unknown as Merchant;
    const loyaltyProgram = {
      id: program.id,
      merchant_id: program.merchant_id,
      name: program.name,
      type: program.type,
      is_active: program.is_active,
      config: program.config,
      created_at: program.created_at,
      updated_at: program.updated_at,
    } as LoyaltyProgram;

    const { data: rows } = await admin
      .from("customer_progress")
      .select("id, pass_id, google_object_id, progress, created_at")
      .eq("program_id", program.id);

    for (const row of rows ?? []) {
      pending.push({ loyaltyProgram, merchant, row });
    }
  }

  const batchResult = await processInBatches(pending, async ({ loyaltyProgram, merchant, row }) => {
    await pushWalletUpdate({
      passId: row.pass_id,
      googleObjectId: row.google_object_id,
      program: loyaltyProgram,
      merchant,
      progress: row.progress,
      enrolledAt: row.created_at,
      // Only the expiration countdown text changes here — progress
      // (and therefore the hero image) is untouched.
      skipHeroImageRefresh: true,
    });
  });

  if (batchResult.failed > 0) {
    console.error(
      `[cron:expiration] ${batchResult.failed}/${pending.length} refreshes failed`,
      batchResult.errors.map((e) => (e.error instanceof Error ? e.error.message : e.error))
    );
  }

  return { refreshed: batchResult.succeeded, failed: batchResult.failed };
}
