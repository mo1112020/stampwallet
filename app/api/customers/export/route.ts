import { jsonError, requireMerchant } from "@/lib/api";

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

  const { data: rows, error } = await auth.supabase
    .from("customer_progress")
    .select("pass_id, progress, customers(name, email, phone)")
    .eq("program_id", programId);

  if (error) return jsonError(error.message, "export_failed", 500);

  const header = "pass_id,name,email,phone,progress\n";
  const lines = (rows ?? []).map((row) => {
    const c = row.customers as unknown as {
      name: string | null;
      email: string | null;
      phone: string | null;
    } | null;
    return [
      row.pass_id,
      c?.name ?? "",
      c?.email ?? "",
      c?.phone ?? "",
      JSON.stringify(row.progress).replaceAll(",", ";"),
    ].join(",");
  });

  return new Response(header + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="customers-${programId}.csv"`,
    },
  });
}
