import type { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS } from "@/lib/billing/plans";

/**
 * Kept as its own leaf module (no imports from lib/wallet or
 * lib/notifications) specifically so lib/wallet/push.ts can import it
 * without a cycle back through lib/billing/enforcement.tsx ->
 * lib/notifications/campaigns.ts -> lib/wallet/push.ts.
 *
 * Only matters once a merchant is on the Free plan (whether they signed up
 * that way or were enforced onto it) — for every other plan this is a
 * no-op, so callers should check merchant.plan === "free" before calling
 * this at all, to skip the extra query for the overwhelming majority of
 * pushes. Ranked by pass_id (not customer_progress.id) because that's what
 * every pushWalletUpdate call site actually has on hand.
 */
export async function isWithinFreePlanNotificationCap(
  admin: ReturnType<typeof createAdminClient>,
  programId: string,
  passId: string
): Promise<boolean> {
  const cap = PLAN_LIMITS.free.maxActiveCustomers;
  if (cap === null) return true;

  const { data: rows } = await admin
    .from("customer_progress")
    .select("pass_id")
    .eq("program_id", programId)
    .order("created_at", { ascending: true })
    .limit(cap);

  return (rows ?? []).some((r) => r.pass_id === passId);
}
