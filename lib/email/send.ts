import type { ReactElement } from "react";
import { createResendClient, emailFrom, isResendConfigured } from "@/lib/email/client";
import { createAdminClient } from "@/lib/supabase/admin";

export type SendEmailParams = {
  /** Deterministic per "this should happen at most once" rule, e.g.
   * `welcome:<merchant_id>` or `subscription_activated:<stripe_event_id>` —
   * the unique constraint on email_events.idempotency_key is what actually
   * enforces the guarantee; this is just picking the right key. */
  idempotencyKey: string;
  emailType: string;
  to: string;
  subject: string;
  react: ReactElement;
  userId?: string | null;
  merchantId?: string | null;
  metadata?: Record<string, unknown>;
};

export type SendEmailResult =
  | { sent: true; skipped: false; providerMessageId: string }
  | { sent: false; skipped: true }
  | { sent: false; skipped: false; error: string };

/** True if this address has previously bounced or complained (see
 * app/api/webhooks/resend/route.ts, which populates email_suppressions) —
 * checked before every send so a bad address doesn't keep getting emailed
 * indefinitely and dragging down deliverability for everything else this
 * app sends. */
async function isSuppressed(admin: ReturnType<typeof createAdminClient>, email: string): Promise<boolean> {
  const { data } = await admin
    .from("email_suppressions")
    .select("email")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  return Boolean(data);
}

/** Non-production sends never reach real inboxes unless explicitly opted
 * into via RESEND_DEV_MODE_TO (redirects everything there instead) — a
 * missing/misconfigured env var in preview/dev must never mean "silently
 * emails whoever happens to sign up while testing." */
function resolveRecipient(to: string): { to: string; devRedirected: boolean } {
  const isProd = process.env.VERCEL_ENV === "production" || (!process.env.VERCEL_ENV && process.env.NODE_ENV === "production");
  if (isProd) return { to, devRedirected: false };
  const devTo = process.env.RESEND_DEV_MODE_TO;
  if (devTo) return { to: devTo, devRedirected: true };
  return { to: "", devRedirected: true };
}

/**
 * The single gate every outbound email in the app goes through. Idempotent
 * via the same insert-first/unique-key pattern already used for
 * billing_events and notification_sends — a 23505 on the insert means an
 * email with this exact idempotency key was already attempted, so this is
 * a no-op, not a retry. A Resend failure updates the row and returns
 * {sent:false} rather than throwing — callers (webhooks, signup, cron)
 * must never fail their own operation because an email didn't go out.
 */
export async function sendTransactionalEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const admin = createAdminClient();

  const { data: row, error: insertError } = await admin
    .from("email_events")
    .insert({
      user_id: params.userId ?? null,
      merchant_id: params.merchantId ?? null,
      email_type: params.emailType,
      recipient_email: params.to,
      idempotency_key: params.idempotencyKey,
      status: "queued",
      metadata: params.metadata ?? {},
    })
    .select("id")
    .single();

  if (insertError) {
    if (insertError.code === "23505") {
      // Never log idempotencyKey verbatim — for auth emails (verify/reset/
      // invite) it embeds Supabase's token_hash, a real security secret.
      console.info("[email] skipped (already sent)", { emailType: params.emailType, userId: params.userId ?? null });
      return { sent: false, skipped: true };
    }
    console.error("[email] failed to log email_events row", { emailType: params.emailType, error: insertError.message });
    return { sent: false, skipped: false, error: insertError.message };
  }

  const eventId = row.id as string;

  if (await isSuppressed(admin, params.to)) {
    await admin.from("email_events").update({ status: "failed", error: "suppressed: previously bounced or complained" }).eq("id", eventId);
    console.info("[email] recipient suppressed (prior bounce/complaint), skipping send", { emailType: params.emailType, eventId });
    return { sent: false, skipped: false, error: "suppressed" };
  }

  if (!isResendConfigured()) {
    await admin.from("email_events").update({ status: "failed", error: "RESEND_API_KEY not configured" }).eq("id", eventId);
    console.warn("[email] Resend not configured, skipping send", { emailType: params.emailType, eventId });
    return { sent: false, skipped: false, error: "not_configured" };
  }

  const { to, devRedirected } = resolveRecipient(params.to);
  if (!to) {
    await admin.from("email_events").update({ status: "failed", error: "dev environment, no RESEND_DEV_MODE_TO set" }).eq("id", eventId);
    console.info("[email] dev/preview environment with no RESEND_DEV_MODE_TO — not sending", { emailType: params.emailType, eventId });
    return { sent: false, skipped: false, error: "dev_no_recipient" };
  }

  try {
    const resend = createResendClient();
    const { data, error } = await resend.emails.send({
      from: emailFrom(),
      to,
      subject: devRedirected ? `[DEV → ${params.to}] ${params.subject}` : params.subject,
      react: params.react,
    });

    if (error || !data) {
      const message = error?.message ?? "Unknown Resend error";
      await admin.from("email_events").update({ status: "failed", error: message }).eq("id", eventId);
      console.error("[email] send failed", { emailType: params.emailType, eventId, error: message });
      return { sent: false, skipped: false, error: message };
    }

    await admin.from("email_events").update({ status: "sent", provider_message_id: data.id }).eq("id", eventId);
    console.info("[email] sent", { emailType: params.emailType, eventId, providerMessageId: data.id, userId: params.userId ?? null });
    return { sent: true, skipped: false, providerMessageId: data.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await admin.from("email_events").update({ status: "failed", error: message }).eq("id", eventId);
    console.error("[email] send threw", { emailType: params.emailType, eventId, error: message });
    return { sent: false, skipped: false, error: message };
  }
}
