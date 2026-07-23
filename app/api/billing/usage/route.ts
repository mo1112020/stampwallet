import { jsonOk, requireCapability } from "@/lib/api";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { countSeats } from "@/lib/stripe/seats";

export async function GET() {
  const auth = await requireCapability("billing");
  if ("error" in auth) return auth.error;

  const { count: programCount } = await auth.supabase
    .from("loyalty_programs")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", auth.merchantId)
    .eq("is_active", true);

  const { count: customerCount } = await auth.supabase
    .from("customer_progress")
    .select("*, loyalty_programs!inner(merchant_id)", { count: "exact", head: true })
    .eq("loyalty_programs.merchant_id", auth.merchantId);

  const { count: locationCount } = await auth.supabase
    .from("store_locations")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", auth.merchantId);

  const seats = await countSeats(auth.merchantId);
  const limits = PLAN_LIMITS[auth.merchant.plan];

  return jsonOk({
    plan: auth.merchant.plan,
    programs: { used: programCount ?? 0, limit: limits.maxActivePrograms },
    customers: { used: customerCount ?? 0, limit: limits.maxActiveCustomers },
    seats: { used: seats, limit: limits.maxSeats },
    locations: { used: locationCount ?? 0, limit: limits.maxLocations },
  });
}
