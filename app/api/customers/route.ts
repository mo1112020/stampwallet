import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { listAllCustomers as queryAllCustomers } from "@/lib/customers/queries";

/** Merchant-wide customer directory (all programs). Search + optional program/birthday-month filter. */
async function listAllCustomers(request: Request) {
  const auth = await requireCapability("view_analytics");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.trim();
  const filterProgramId = searchParams.get("filter_program_id") ?? undefined;
  const filter = searchParams.get("filter"); // "birthday_month" | null

  try {
    const result = await queryAllCustomers(auth, {
      search,
      filterProgramId,
      filter: filter === "birthday_month" ? "birthday_month" : null,
    });
    return jsonOk(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "List failed", "list_failed", 500);
  }
}

/** Original per-program customer list, used by /dashboard/programs/[programId]/customers. Unchanged. */
async function listForProgram(programId: string) {
  const auth = await requireCapability("manage_programs");
  if ("error" in auth) return auth.error;

  const { data: program } = await auth.supabase
    .from("loyalty_programs")
    .select("id, merchant_id")
    .eq("id", programId)
    .single();

  if (!program) return jsonError("Program not found", "not_found", 404);
  if (program.merchant_id !== auth.merchantId) {
    return jsonError("Forbidden", "forbidden", 403);
  }

  const { data, error } = await auth.supabase
    .from("customer_progress")
    .select("*, customers(*)")
    .eq("program_id", programId);

  if (error) return jsonError(error.message, "list_failed", 500);
  return jsonOk(data);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("program_id");
  return programId ? listForProgram(programId) : listAllCustomers(request);
}
