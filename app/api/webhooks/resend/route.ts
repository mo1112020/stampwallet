import { createResendClient } from "@/lib/email/client";
import { createAdminClient } from "@/lib/supabase/admin";

const STATUS_BY_EVENT: Record<string, "sent" | "failed"> = {
  "email.delivered": "sent",
  "email.opened": "sent",
  "email.clicked": "sent",
  "email.bounced": "failed",
  "email.complained": "failed",
  "email.failed": "failed",
  "email.delivery_delayed": "sent",
};

/**
 * Resend delivery-event webhook — observability only (email_events.status
 * gets corrected from "sent" (accepted by Resend) to a real delivery
 * outcome). Register this URL + subscribe to the events below from the
 * Resend Dashboard (Webhooks) — see the final report for exact steps.
 */
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend-webhook] RESEND_WEBHOOK_SECRET not configured");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");
  if (!svixId || !svixTimestamp || !svixSignature) {
    return Response.json({ error: "Missing signature headers" }, { status: 400 });
  }

  let event: { type: string; data: { email_id: string; bounce?: { message: string }; failed?: { reason: string } } };
  try {
    const resend = createResendClient();
    event = resend.webhooks.verify({
      payload,
      headers: { id: svixId, timestamp: svixTimestamp, signature: svixSignature },
      webhookSecret: secret,
    }) as typeof event;
  } catch (err) {
    console.error("[resend-webhook] signature verification failed", err instanceof Error ? err.message : "unknown error");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const status = STATUS_BY_EVENT[event.type];
  if (!status || !event.data?.email_id) {
    // Event type we don't track status transitions for (e.g. email.sent,
    // email.scheduled, contact/domain events if ever subscribed) — not an
    // error, just nothing to update.
    return Response.json({});
  }

  const admin = createAdminClient();
  const detail = event.data.bounce?.message ?? event.data.failed?.reason ?? null;
  const { error } = await admin
    .from("email_events")
    .update({
      status,
      ...(detail ? { error: detail } : {}),
    })
    .eq("provider_message_id", event.data.email_id);

  if (error) {
    console.error("[resend-webhook] failed to update email_events", { eventType: event.type, error: error.message });
  } else {
    console.info("[resend-webhook] recorded", { eventType: event.type, status });
  }

  return Response.json({});
}
