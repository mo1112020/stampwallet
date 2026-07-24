import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { PLAN_LIMITS, isWithinLimit } from "@/lib/billing/plans";
import { storeLocationSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("store_locations")
    .select("*, store_location_programs(program_id)")
    .eq("merchant_id", auth.merchantId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, "list_failed", 500);

  const withProgramIds = (data ?? []).map((row) => {
    const { store_location_programs, ...location } = row as Record<string, unknown> & {
      store_location_programs: { program_id: string }[];
    };
    return { ...location, program_ids: store_location_programs.map((p: { program_id: string }) => p.program_id) };
  });

  return jsonOk(withProgramIds);
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

  const { program_ids, ...locationFields } = parsed.data;

  const { data, error } = await auth.supabase
    .from("store_locations")
    .insert({ ...locationFields, merchant_id: auth.merchantId })
    .select("*")
    .single();

  if (error || !data) return jsonError(error?.message ?? "Create failed", "create_failed", 500);

  if (program_ids && program_ids.length > 0) {
    await auth.supabase
      .from("store_location_programs")
      .insert(program_ids.map((program_id) => ({ store_location_id: data.id, program_id })));
  }

  return jsonOk({ ...data, program_ids: program_ids ?? [] }, 201);
}
