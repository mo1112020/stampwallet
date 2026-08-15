import { jsonError, jsonOk, requireMerchant } from "@/lib/api";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { updateProgramSchema } from "@/lib/validators";
import { pushProgramUpdateToAllCustomers } from "@/lib/wallet/push";

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

  if (parsed.data.config?.expiration?.enabled && !PLAN_LIMITS[auth.merchant.plan].cardExpiration) {
    return jsonError(
      `Card expiration is a paid-plan feature. Upgrade to enable it.`,
      "plan_limit",
      403
    );
  }

  const { data, error } = await auth.supabase
    .from("loyalty_programs")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return jsonError(error.message, "update_failed", 500);

  // Fire-and-forget (same pattern as the manual campaign-send route below
  // it in this file's sibling): don't make the merchant wait on a
  // potentially-large fan-out of wallet pushes just to save their edits.
  pushProgramUpdateToAllCustomers(existing.merchant_id, id).catch((err) =>
    console.error("[wallet:push] program update broadcast failed for", id, err)
  );

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

  // A hard delete cascades through customer_progress -> scan_events /
  // redemptions / apple_device_registrations (see 001_initial_schema.sql,
  // 003_apple_wallet_devices.sql, 011_notifications.sql), permanently
  // erasing every enrolled customer's stamp/point history with no way to
  // recover it, and silently orphaning any wallet pass already on a
  // customer's phone (it 404s on next refresh instead of being revoked).
  // Deletion is only safe once nobody is enrolled — otherwise the merchant
  // should archive the program (the existing "Active" toggle, PATCH
  // is_active:false) which hides it from new customers without touching
  // history.
  const { count: customerCount, error: countError } = await auth.supabase
    .from("customer_progress")
    .select("id", { count: "exact", head: true })
    .eq("program_id", id);

  if (countError) return jsonError(countError.message, "delete_failed", 500);

  if ((customerCount ?? 0) > 0) {
    return jsonError(
      `This program has ${customerCount} enrolled customer${customerCount === 1 ? "" : "s"} and can't be deleted. Turn off "Active" and save instead to archive it — history and wallet passes stay intact.`,
      "program_has_customers",
      409
    );
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
