import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { updateMerchantSettingsSchema } from "@/lib/validators";
import { pushProgramUpdateToAllCustomers } from "@/lib/wallet/push";

// Fields that actually render on an issued Apple/Google Wallet pass — a
// merchant editing any of these expects already-installed passes to update
// on their own, the same way a program edit does (app/api/programs/[id]/route.ts),
// not just new enrollments. Fields like industry/currency/timezone/
// notification_prefs never reach the pass, so they don't need this.
const WALLET_VISUAL_FIELDS = ["business_name", "logo_url", "brand_color_primary", "brand_color_secondary"] as const;

/**
 * Single endpoint for every "just a field on the merchants row" settings
 * form (profile, branding, business metrics, locale/timezone, notification
 * prefs) — each form PATCHes only the subset of fields it owns, avoiding a
 * separate route per section for what's ultimately one table.
 */
export async function PATCH(request: Request) {
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = updateMerchantSettingsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const { data, error } = await auth.supabase
    .from("merchants")
    .update(parsed.data)
    .eq("id", auth.merchantId)
    .select("*")
    .single();

  if (error || !data) return jsonError(error?.message ?? "Update failed", "update_failed", 500);

  const touchedWalletVisuals = WALLET_VISUAL_FIELDS.some((field) => field in parsed.data);
  if (touchedWalletVisuals) {
    const { data: programs } = await auth.supabase
      .from("loyalty_programs")
      .select("id")
      .eq("merchant_id", auth.merchantId)
      .eq("is_active", true);
    for (const program of programs ?? []) {
      pushProgramUpdateToAllCustomers(auth.merchantId, program.id).catch((err) =>
        console.error("[wallet:push] merchant branding broadcast failed for program", program.id, err)
      );
    }
  }

  return jsonOk(data);
}
