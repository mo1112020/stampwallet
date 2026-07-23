import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { updateMerchantSettingsSchema } from "@/lib/validators";

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
  return jsonOk(data);
}
