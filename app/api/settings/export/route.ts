import { requireCapability } from "@/lib/api";

/**
 * Full-account data export — distinct from the per-program customer CSV at
 * /api/customers/export (operational). This is the account-level "give me
 * everything" bundle for data-portability/GDPR-style requests.
 */
export async function GET() {
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const { data: programs } = await auth.supabase
    .from("loyalty_programs")
    .select("*")
    .eq("merchant_id", auth.merchantId);
  const programIds = (programs ?? []).map((p) => p.id);

  const { data: customers } = await auth.supabase
    .from("customers")
    .select("*")
    .eq("merchant_id", auth.merchantId);

  const { data: progress } = programIds.length
    ? await auth.supabase.from("customer_progress").select("*").in("program_id", programIds)
    : { data: [] };
  const progressIds = (progress ?? []).map((p) => p.id);

  const { data: scanEvents } = progressIds.length
    ? await auth.supabase.from("scan_events").select("*").in("customer_progress_id", progressIds)
    : { data: [] };

  const { data: redemptions } = progressIds.length
    ? await auth.supabase.from("redemptions").select("*").in("customer_progress_id", progressIds)
    : { data: [] };

  const bundle = {
    exported_at: new Date().toISOString(),
    merchant: auth.merchant,
    programs,
    customers,
    customer_progress: progress,
    scan_events: scanEvents,
    redemptions,
  };

  return new Response(JSON.stringify(bundle, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="stampwallet-export-${auth.merchantId}.json"`,
    },
  });
}
