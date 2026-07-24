import { jsonError, requireCapability, requireMerchant } from "@/lib/api";

function csvField(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Per-program export — used by /dashboard/programs/[programId]/customers. Unchanged. */
async function exportForProgram(programId: string) {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

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
    const c = row.customers as unknown as { name: string | null; email: string | null; phone: string | null } | null;
    return [
      row.pass_id,
      csvField(c?.name ?? ""),
      csvField(c?.email ?? ""),
      csvField(c?.phone ?? ""),
      csvField(JSON.stringify(row.progress)),
    ].join(",");
  });

  return new Response(header + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="customers-${programId}.csv"`,
    },
  });
}

/** Merchant-wide export — all customers across every program. */
async function exportAll() {
  const auth = await requireCapability("export_customers");
  if ("error" in auth) return auth.error;

  const { data: rows, error } = await auth.supabase
    .from("customers")
    .select("name, email, phone, birthday, created_at, customer_progress(loyalty_programs(name))")
    .eq("merchant_id", auth.merchantId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, "export_failed", 500);

  const header = "name,email,phone,birthday,created_at,programs\n";
  const lines = (rows ?? []).map((row) => {
    const progress = row.customer_progress as unknown as { loyalty_programs: { name: string } | null }[];
    const programs = progress.map((p) => p.loyalty_programs?.name).filter(Boolean).join("; ");
    return [
      csvField(row.name ?? ""),
      csvField(row.email ?? ""),
      csvField(row.phone ?? ""),
      csvField(row.birthday ?? ""),
      csvField(row.created_at),
      csvField(programs),
    ].join(",");
  });

  return new Response(header + lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="customers.csv"`,
    },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const programId = searchParams.get("program_id");
  return programId ? exportForProgram(programId) : exportAll();
}
