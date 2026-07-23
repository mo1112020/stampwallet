import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { PLAN_LIMITS, isWithinLimit } from "@/lib/billing/plans";
import { storeLocationSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("store_locations")
    .select("*")
    .eq("merchant_id", auth.merchantId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, "list_failed", 500);
  return jsonOk(data);
}

export async function POST(request: Request) {
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = storeLocationSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const limits = PLAN_LIMITS[auth.merchant.plan];
  const { count } = await auth.supabase
    .from("store_locations")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", auth.merchantId);

  if (!isWithinLimit(count ?? 0, limits.maxLocations)) {
    return jsonError(
      `Your ${auth.merchant.plan} plan allows ${limits.maxLocations} location(s). Upgrade to add more.`,
      "plan_limit",
      403
    );
  }

  const { data, error } = await auth.supabase
    .from("store_locations")
    .insert({ ...parsed.data, merchant_id: auth.merchantId })
    .select("*")
    .single();

  if (error || !data) return jsonError(error?.message ?? "Create failed", "create_failed", 500);
  return jsonOk(data, 201);
}
