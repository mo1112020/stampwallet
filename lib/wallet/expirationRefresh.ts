import { createAdminClient } from "@/lib/supabase/admin";
import { pushWalletUpdate } from "@/lib/wallet/push";
import type { CardAppearance, LoyaltyProgram, Merchant, Progress } from "@/types";

/** Refreshes wallet passes for every active program with card expiration
 * enabled, so the "N days remaining" text (and Apple/Google's native
 * expiration date) stays accurate day to day without waiting for the
 * customer's next scan. Runs from the daily notifications cron. */
export async function refreshExpiringPasses() {
  const admin = createAdminClient();

  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("*, merchants(*)")
    .eq("is_active", true);

  const expiringPrograms = (programs ?? []).filter(
    (p) => (p.config as CardAppearance).expiration?.enabled
  );
  if (expiringPrograms.length === 0) return { refreshed: 0 };

  let refreshed = 0;
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
      try {
        await pushWalletUpdate({
          passId: row.pass_id,
          googleObjectId: row.google_object_id,
          program: loyaltyProgram,
          merchant,
          progress: row.progress as Progress,
          enrolledAt: row.created_at,
        });
        refreshed++;
      } catch (err) {
        console.error("[cron:expiration] refresh failed for", row.pass_id, err);
      }
    }
  }

  return { refreshed };
}
