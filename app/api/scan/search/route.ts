import { jsonError, jsonOk, requireCapability } from "@/lib/api";

/**
 * Name/phone lookup for the scanner UI — a fallback for when the camera
 * can't read a code (bad lighting, a cracked/dirty screen, camera
 * permission denied, an older device with no camera API support at all).
 * Deliberately scoped to "scan" (not "view_analytics" like /api/customers,
 * which staff don't have) so any scanning role can use it, and returns
 * only what's needed to pick the right card and hand off to the existing
 * confirm/award/redeem flow — not the full customer directory.
 */
export async function GET(request: Request) {
  const auth = await requireCapability("scan");
  if ("error" in auth) return auth.error;

  const raw = new URL(request.url).searchParams.get("q")?.trim();
  if (!raw || raw.length < 2) return jsonOk([]);

  // `.or()` takes a PostgREST filter *string*, so anything with meaning in
  // that grammar — commas (separate filters), parens (grouping), dots
  // (column.operator), quotes/backslashes — has to come out before the term
  // is interpolated, or a crafted search could alter which rows the filter
  // matches. Harmless to strip for a name/phone lookup.
  const q = raw.replace(/[,()."'\\*]/g, " ").trim();
  if (q.length < 2) return jsonOk([]);

  const { data, error } = await auth.supabase
    .from("customers")
    .select("name, phone, customer_progress(pass_id, loyalty_programs(name, is_active))")
    .eq("merchant_id", auth.merchantId)
    .or(`name.ilike.%${q}%,phone.ilike.%${q}%`)
    .limit(10);

  if (error) return jsonError(error.message, "search_failed", 500);

  const results = (data ?? []).flatMap((customer) =>
    (customer.customer_progress as unknown as { pass_id: string; loyalty_programs: { name: string; is_active: boolean } | null }[]).map(
      (cp) => ({
        pass_id: cp.pass_id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        program_name: cp.loyalty_programs?.name ?? "",
        program_active: cp.loyalty_programs?.is_active ?? false,
      })
    )
  );

  return jsonOk(results.slice(0, 15));
}
