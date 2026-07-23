import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import type { Customer, LoyaltyProgram, Merchant, Progress } from "@/types";

/**
 * Read-only peek at a scanned pass before committing an award/redeem —
 * lets the scanner UI show customer info, program type, and current
 * progress (so it can e.g. prompt for a points amount) without mutating
 * anything. POST /api/scan does the actual award/redeem.
 */
export async function GET(request: Request) {
  const auth = await requireCapability("scan");
  if ("error" in auth) return auth.error;

  const passId = new URL(request.url).searchParams.get("pass_id");
  if (!passId) return jsonError("pass_id is required", "validation_error", 400);

  const { data: row, error } = await auth.supabase
    .from("customer_progress")
    .select("pass_id, progress, loyalty_programs(*, merchants(*)), customers(*)")
    .eq("pass_id", passId)
    .maybeSingle();

  if (error || !row) return jsonError("Pass not found", "not_found", 404);

  const program = row.loyalty_programs as unknown as LoyaltyProgram & { merchants: Merchant };
  const customer = row.customers as unknown as Customer;

  if (program.merchant_id !== auth.merchantId) {
    return jsonError("Forbidden", "forbidden", 403);
  }

  return jsonOk({
    pass_id: row.pass_id,
    progress: row.progress as Progress,
    program: {
      id: program.id,
      name: program.name,
      type: program.type,
      config: program.config,
      is_active: program.is_active,
    },
    customer: customer
      ? { name: customer.name, phone: customer.phone, email: customer.email }
      : null,
    business_name: program.merchants.business_name,
  });
}
