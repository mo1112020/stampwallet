import type { createAdminClient } from "@/lib/supabase/admin";
import type { CardAppearance } from "@/types";

/** Card expiration is Paid-plan only (see PLAN_LIMITS.cardExpiration) — call
 * this whenever a merchant's plan drops to one without it (subscription
 * canceled/expired) so no program keeps showing expiry countdowns it's no
 * longer entitled to. */
export async function disableCardExpirationForMerchant(
  admin: ReturnType<typeof createAdminClient>,
  merchantId: string
) {
  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("id, config")
    .eq("merchant_id", merchantId);

  for (const program of programs ?? []) {
    const config = program.config as CardAppearance;
    if (!config.expiration?.enabled) continue;
    await admin
      .from("loyalty_programs")
      .update({ config: { ...config, expiration: { ...config.expiration, enabled: false } } })
      .eq("id", program.id);
  }
}
