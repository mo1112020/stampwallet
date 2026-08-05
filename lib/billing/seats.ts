import { createAdminClient } from "@/lib/supabase/admin";

/** Used against PLAN_LIMITS.maxSeats as a cap, not a billing multiplier —
 * plans are flat-priced (see lib/billing/plans.ts), so this only matters
 * for enforcing the seat limit, not for what a merchant is charged. */
export async function countSeats(merchantId: string): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from("staff_accounts")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", merchantId)
    .neq("status", "revoked");
  return (count ?? 0) + 1; // +1 for the owner's own seat
}
