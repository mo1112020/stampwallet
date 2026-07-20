import { jsonError, jsonOk, requireMerchant } from "@/lib/api";

export async function GET(request: Request) {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("program_id");
  if (!programId) return jsonError("program_id required", "validation_error", 400);

  const { data: program } = await auth.supabase
    .from("loyalty_programs")
    .select("id, merchant_id")
    .eq("id", programId)
    .single();

  if (!program) return jsonError("Program not found", "not_found", 404);
  if (program.merchant_id !== auth.userId) {
    return jsonError("Forbidden", "forbidden", 403);
  }

  const { data, error } = await auth.supabase
    .from("customer_progress")
    .select("*, customers(*)")
    .eq("program_id", programId);

  if (error) return jsonError(error.message, "list_failed", 500);
  return jsonOk(data);
}
