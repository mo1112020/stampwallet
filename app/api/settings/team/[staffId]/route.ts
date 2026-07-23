import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { updateStaffSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ staffId: string }> };

export async function PATCH(request: Request, { params }: Ctx) {
  const { staffId } = await params;
  const auth = await requireCapability("manage_staff");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = updateStaffSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const { data: existing } = await auth.supabase
    .from("staff_accounts")
    .select("id, merchant_id")
    .eq("id", staffId)
    .maybeSingle();

  if (!existing || existing.merchant_id !== auth.merchantId) {
    return jsonError("Staff member not found", "not_found", 404);
  }

  const update: Record<string, string> = {};
  if (parsed.data.role) update.role = parsed.data.role;
  if (parsed.data.status) update.status = parsed.data.status;

  const { data, error } = await auth.supabase
    .from("staff_accounts")
    .update(update)
    .eq("id", staffId)
    .select("*")
    .single();

  if (error || !data) return jsonError(error?.message ?? "Update failed", "update_failed", 500);
  return jsonOk(data);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { staffId } = await params;
  const auth = await requireCapability("manage_staff");
  if ("error" in auth) return auth.error;

  const { data: existing } = await auth.supabase
    .from("staff_accounts")
    .select("id, merchant_id")
    .eq("id", staffId)
    .maybeSingle();

  if (!existing || existing.merchant_id !== auth.merchantId) {
    return jsonError("Staff member not found", "not_found", 404);
  }

  const { error } = await auth.supabase
    .from("staff_accounts")
    .update({ status: "revoked" })
    .eq("id", staffId);

  if (error) return jsonError(error.message, "revoke_failed", 500);
  return jsonOk({ revoked: true });
}
