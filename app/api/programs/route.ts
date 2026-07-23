import { jsonError, jsonOk, requireMerchant } from "@/lib/api";
import { PLAN_LIMITS, isWithinLimit } from "@/lib/billing/plans";
import { createProgramSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("loyalty_programs")
    .select("*")
    .eq("merchant_id", auth.userId)
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, "list_failed", 500);
  return jsonOk(data);
}

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createProgramSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const limits = PLAN_LIMITS[auth.merchant.plan];
  const { count } = await auth.supabase
    .from("loyalty_programs")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", auth.userId)
    .eq("is_active", true);

  if (!isWithinLimit(count ?? 0, limits.maxActivePrograms)) {
    return jsonError(
      `Your ${auth.merchant.plan} plan allows ${limits.maxActivePrograms} active program(s). Upgrade to create more.`,
      "plan_limit",
      403
    );
  }

  const { data, error } = await auth.supabase
    .from("loyalty_programs")
    .insert({
      merchant_id: auth.userId,
      name: parsed.data.name,
      type: parsed.data.type,
      config: parsed.data.config,
    })
    .select("*")
    .single();

  if (error) return jsonError(error.message, "create_failed", 500);

  const requestUrl = new URL(request.url);
  const host = request.headers.get("x-forwarded-host") ?? requestUrl.host;
  const protocol = request.headers.get("x-forwarded-proto") ?? requestUrl.protocol.replace(":", "");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  const locale = auth.merchant.locale_default || "en";

  return jsonOk(
    {
      ...data,
      enrollment_url: `${appUrl}/${locale}/pass/new?program=${data.id}`,
    },
    201
  );
}
