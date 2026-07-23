import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Irreversible. Requires the caller to echo back the exact business name as
 * a confirmation body field — a lightweight safety net against an accidental
 * call, on top of the UI's own confirmation dialog (not a security boundary
 * by itself; requireCapability already gates who can call this at all).
 * Deleting the auth.users row cascades through merchants -> loyalty_programs
 * -> customers -> customer_progress -> scan_events/redemptions, and
 * merchants -> staff_accounts, via the existing FK on delete cascade chain
 * (migration 001/005) — nothing else to clean up manually.
 */
export async function DELETE(request: Request) {
  const auth = await requireCapability("delete_account");
  if ("error" in auth) return auth.error;

  const body = await request.json().catch(() => ({}) as { confirm_business_name?: string });
  if (body.confirm_business_name !== auth.merchant.business_name) {
    return jsonError("Business name confirmation does not match", "confirmation_mismatch", 400);
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server is not configured with Supabase service role", "misconfigured", 503);
  }

  const { error } = await admin.auth.admin.deleteUser(auth.merchantId);
  if (error) return jsonError(error.message, "delete_failed", 500);

  return jsonOk({ deleted: true });
}
