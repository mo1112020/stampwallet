import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { updateStoreLocationSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = updateStoreLocationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const { data: existing } = await auth.supabase
    .from("store_locations")
    .select("id, merchant_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.merchant_id !== auth.merchantId) {
    return jsonError("Location not found", "not_found", 404);
  }

  const { data, error } = await auth.supabase
    .from("store_locations")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error || !data) return jsonError(error?.message ?? "Update failed", "update_failed", 500);
  return jsonOk(data);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const { data: existing } = await auth.supabase
    .from("store_locations")
    .select("id, merchant_id")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.merchant_id !== auth.merchantId) {
    return jsonError("Location not found", "not_found", 404);
  }

  const { error } = await auth.supabase.from("store_locations").delete().eq("id", id);
  if (error) return jsonError(error.message, "delete_failed", 500);
  return jsonOk({ deleted: true });
}
