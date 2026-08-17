import { after } from "next/server";
import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { sendCampaignNow } from "@/lib/notifications/campaigns";
import { createCampaignSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("notification_campaigns")
    .select("*")
    .eq("merchant_id", auth.merchantId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return jsonError(error.message, "list_failed", 500);
  return jsonOk(data);
}

export async function POST(request: Request) {
  const auth = await requireCapability("manage_settings");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = createCampaignSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const { data: campaign, error } = await auth.supabase
    .from("notification_campaigns")
    .insert({
      merchant_id: auth.merchantId,
      type: parsed.data.type,
      title: parsed.data.title,
      message: parsed.data.message,
      segment: parsed.data.segment,
      program_id: parsed.data.segment.program_id ?? null,
      scheduled_for: parsed.data.scheduled_for ?? null,
      status: parsed.data.type === "scheduled" ? "scheduled" : "draft",
    })
    .select("*")
    .single();

  if (error || !campaign) {
    return jsonError(error?.message ?? "Could not create campaign", "create_failed", 500);
  }

  if (parsed.data.type === "manual") {
    // after() (not a bare un-awaited call) so the serverless function stays
    // alive until the send finishes instead of freezing the instant the
    // response above is returned — a bare fire-and-forget call here is what
    // left several campaigns permanently stuck on "sending": the process
    // could be frozen mid-loop, or between the loop finishing and the final
    // status update, with no guarantee either ever got to run.
    after(() =>
      sendCampaignNow(campaign.id).catch((err) =>
        console.error("[notifications] campaign send failed", campaign.id, err)
      )
    );
  }

  return jsonOk(campaign, 201);
}
