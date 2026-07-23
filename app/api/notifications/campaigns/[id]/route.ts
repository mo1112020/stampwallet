import { jsonError, jsonOk, requireCapability } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const { data: campaign, error } = await auth.supabase
    .from("notification_campaigns")
    .select("*")
    .eq("id", id)
    .eq("merchant_id", auth.merchantId)
    .maybeSingle();

  if (error || !campaign) return jsonError("Campaign not found", "not_found", 404);

  const { data: sends } = await auth.supabase
    .from("notification_sends")
    .select("*, customer_progress(customers(name))")
    .eq("campaign_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  return jsonOk({ campaign, sends: sends ?? [] });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const { id } = await params;
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const { data: existing } = await auth.supabase
    .from("notification_campaigns")
    .select("id, merchant_id, status")
    .eq("id", id)
    .maybeSingle();

  if (!existing || existing.merchant_id !== auth.merchantId) {
    return jsonError("Campaign not found", "not_found", 404);
  }
  if (existing.status !== "scheduled" && existing.status !== "draft") {
    return jsonError("Only scheduled or draft campaigns can be canceled", "invalid_state", 400);
  }

  const { error } = await auth.supabase
    .from("notification_campaigns")
    .update({ status: "canceled" })
    .eq("id", id);

  if (error) return jsonError(error.message, "cancel_failed", 500);
  return jsonOk({ canceled: true });
}
