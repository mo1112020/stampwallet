import { jsonError, jsonOk, requireMerchant } from "@/lib/api";
import { updateProgramSchema } from "@/lib/validators";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) return jsonError("Program not found", "not_found", 404);
  if (data.merchant_id !== auth.userId) {
    return jsonError("Forbidden", "forbidden", 403);
  }
  return jsonOk(data);
}

export async function PATCH(request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const { data: existing } = await auth.supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) return jsonError("Program not found", "not_found", 404);
  if (existing.merchant_id !== auth.userId) {
    return jsonError("Forbidden", "forbidden", 403);
  }

  const body = await request.json();
  const parsed = updateProgramSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const { data, error } = await auth.supabase
    .from("loyalty_programs")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, "update_failed", 500);
  return jsonOk(data);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const { data: existing } = await auth.supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", id)
    .single();

  if (!existing) return jsonError("Program not found", "not_found", 404);
  if (existing.merchant_id !== auth.userId) {
    return jsonError("Forbidden", "forbidden", 403);
  }

  const { data, error } = await auth.supabase
    .from("loyalty_programs")
    .delete()
    .eq("id", id)
    .select("id")
    .single();

  if (error) return jsonError(error.message, "delete_failed", 500);
  return jsonOk(data);
}
