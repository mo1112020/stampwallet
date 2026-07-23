import { jsonError, jsonOk, requireCapability } from "@/lib/api";

export async function GET(request: Request) {
  const auth = await requireCapability("scan");
  if ("error" in auth) return auth.error;

  const url = new URL(request.url);
  const programId = url.searchParams.get("program_id");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 25, 100);

  let query = auth.supabase
    .from("scan_events")
    .select(
      "id, delta, resulted_in_reward, created_at, customer_progress!inner(pass_id, program_id, customers(name, phone, email), loyalty_programs(id, name, type))"
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (programId) {
    query = query.eq("customer_progress.program_id", programId);
  }

  const { data, error } = await query;
  if (error) return jsonError(error.message, "list_failed", 500);
  return jsonOk(data);
}
