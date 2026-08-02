import type { SessionContext } from "@/lib/api";

type ProgressRow = {
  id: string;
  program_id: string;
  pass_id: string;
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
      "id, name, phone, email, birthday, created_at, customer_progress(id, program_id, pass_id, google_object_id, loyalty_programs(name))"
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

  // "Has Apple Wallet" can only be known once the device actually registers
  // with our PassKit web service (apple_device_registrations, keyed by
  // pass_id/serial_number) — customer_progress.apple_push_token is never
  // written anywhere and always null, so checking it here meant a real,
  // successfully-installed pass could never show as installed.
  const passIds = rows.flatMap((r) => r.customer_progress.map((cp) => cp.pass_id));
  const registeredPassIds = new Set<string>();
  if (passIds.length > 0) {
    const { data: registrations } = await session.supabase
      .from("apple_device_registrations")
      .select("serial_number")
      .in("serial_number", passIds);
    for (const row of registrations ?? []) registeredPassIds.add(row.serial_number as string);
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
    hasApple: r.customer_progress.some((cp) => registeredPassIds.has(cp.pass_id)),
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
