import { jsonError, jsonOk, requireMerchant } from "@/lib/api";
import { onboardingSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const auth = await requireMerchant();
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const { error, data } = await auth.supabase
    .from("merchants")
    .update({
      ...parsed.data,
      onboarding_completed: true,
    })
    .eq("id", auth.userId)
    .select("*")
    .single();

  if (error) return jsonError(error.message, "update_failed", 500);
  return jsonOk(data);
}
