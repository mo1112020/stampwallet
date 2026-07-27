import type { SessionContext } from "@/lib/api";

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

export type CustomerListItem = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  birthday: string | null;
  created_at: string;
  cardsCount: number;
  programs: string[];
  hasApple: boolean;
  hasGoogle: boolean;
};

export type CustomerListStats = { totalCustomers: number; totalCards: number; totalScans: number };

export type CustomerListFilters = {
  search?: string;
  filterProgramId?: string;
  filter?: "birthday_month" | null;
};

/** Merchant-wide customer directory (all programs). Search + optional program/birthday-month filter. */
export async function listAllCustomers(
  session: SessionContext,
  { search, filterProgramId, filter }: CustomerListFilters
): Promise<{ customers: CustomerListItem[]; stats: CustomerListStats }> {
  let query = session.supabase
    .from("customers")
    .select(
      "id, name, phone, email, birthday, created_at, customer_progress(id, program_id, apple_push_token, google_object_id, loyalty_programs(name))"
    )
    .eq("merchant_id", session.merchantId)
    .order("created_at", { ascending: false })
    .limit(200);

  if (search) {
    query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

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
    session.supabase.from("customers").select("*", { count: "exact", head: true }).eq("merchant_id", session.merchantId),
    session.supabase
      .from("customer_progress")
      .select("*, loyalty_programs!inner(merchant_id)", { count: "exact", head: true })
      .eq("loyalty_programs.merchant_id", session.merchantId),
    session.supabase.from("scan_events").select("*", { count: "exact", head: true }).eq("scanned_by", session.merchantId),
  ]);

  return {
    customers,
    stats: { totalCustomers: totalCustomers ?? 0, totalCards: totalCards ?? 0, totalScans: totalScans ?? 0 },
  };
}
