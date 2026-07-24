import { jsonError, jsonOk, requireCapability, requireMerchant } from "@/lib/api";

type ProgressRow = {
  id: string;
  program_id: string;
  apple_push_token: string | null;
  google_object_id: string | null;
  loyalty_programs: { name: string } | null;
};

type CustomerRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  created_at: string;
  customer_progress: ProgressRow[];
};

/** Merchant-wide customer directory (all programs). Search + optional program/birthday-month filter. */
async function listAllCustomers(request: Request) {
  const auth = await requireCapability("view_analytics");
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("q")?.trim();
  const filterProgramId = searchParams.get("filter_program_id");
  const filter = searchParams.get("filter"); // "birthday_month" | null

  let query = auth.supabase
    .from("customers")
    .select(
      "id, name, phone, email, birthday, created_at, customer_progress(id, program_id, apple_push_token, google_object_id, loyalty_programs(name))"
    )
    .eq("merchant_id", auth.merchantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) return jsonError(error.message, "list_failed", 500);

  let rows = (data ?? []) as unknown as CustomerRow[];

  if (filter === "birthday_month") {
    const currentMonth = new Date().getMonth();
    rows = rows.filter((r) => r.birthday && new Date(r.birthday).getMonth() === currentMonth);
  }
  if (filterProgramId) {
    rows = rows.filter((r) => r.customer_progress.some((cp) => cp.program_id === filterProgramId));
  }

  const customers = rows.map((r) => ({
    id: r.id,
    name: r.name,
    phone: r.phone,
    email: r.email,
    birthday: r.birthday,
    created_at: r.created_at,
    cardsCount: r.customer_progress.length,
    programs: r.customer_progress.map((cp) => cp.loyalty_programs?.name).filter(Boolean) as string[],
    hasApple: r.customer_progress.some((cp) => cp.apple_push_token),
    hasGoogle: r.customer_progress.some((cp) => cp.google_object_id),
  }));

  const [{ count: totalCustomers }, { count: totalCards }, { count: totalScans }] = await Promise.all([
    auth.supabase.from("customers").select("*", { count: "exact", head: true }).eq("merchant_id", auth.merchantId),
    auth.supabase
      .from("customer_progress")
      .select("*, loyalty_programs!inner(merchant_id)", { count: "exact", head: true })
      .eq("loyalty_programs.merchant_id", auth.merchantId),
    auth.supabase.from("scan_events").select("*", { count: "exact", head: true }).eq("scanned_by", auth.merchantId),
  ]);

  return jsonOk({
    customers,
    stats: { totalCustomers: totalCustomers ?? 0, totalCards: totalCards ?? 0, totalScans: totalScans ?? 0 },
  });
}

/** Original per-program customer list, used by /dashboard/programs/[programId]/customers. Unchanged. */
async function listForProgram(programId: string) {
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
