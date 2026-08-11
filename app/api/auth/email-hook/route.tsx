import { Webhook } from "standardwebhooks";
import { sendTransactionalEmail } from "@/lib/email/send";
import { VerifyEmailEmail } from "@/components/emails/verify-email";
import { ResetPasswordEmail } from "@/components/emails/reset-password";
import { TeamInviteEmail } from "@/components/emails/team-invite";

type HookUser = {
  id: string;
  email: string;
  user_metadata?: Record<string, unknown>;
};

type HookPayload = {
  user: HookUser;
  email_data: {
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
  };
};

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Points at our own app/auth/confirm route (verifyOtp) rather than
 * Supabase's hosted /auth/v1/verify — that server-side endpoint redirects
 * back to us via a PKCE `code`, which only exchanges successfully on the
 * same browser that initiated the request. Recovery/invite links are
 * routinely opened on a different device (email app on a phone) than
 * where they were requested, so verifyOtp's direct token check is used
 * instead — no code_verifier cookie required. The token itself is still
 * entirely Supabase's; this only changes which server validates it. */
function buildActionUrl(tokenHash: string, actionType: string, redirectTo: string) {
  const url = new URL(`${appUrl()}/auth/confirm`);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", actionType);
  url.searchParams.set("next", redirectTo);
  return url.toString();
}

/**
 * Supabase Auth's "Send Email" hook (Dashboard → Authentication → Hooks) —
 * enabling it stops Supabase sending its own built-in emails and calls this
 * endpoint instead for every auth email (signup confirmation, password
 * recovery, team invites, ...), carrying the real token it generated. This
 * is the officially supported way to send custom-branded auth emails
 * without building a parallel/fake verification system — the token and
 * verification logic are still entirely Supabase's.
 *
 * Manual setup required (cannot be done from code): enable the hook in the
 * Supabase Dashboard and paste SUPABASE_AUTH_HOOK_SECRET as the signing
 * secret — see the final report for exact steps.
 */
export async function POST(request: Request) {
  const rawSecret = process.env.SUPABASE_AUTH_HOOK_SECRET;
  if (!rawSecret) {
    console.error("[email-hook] SUPABASE_AUTH_HOOK_SECRET not configured");
    return Response.json({ error: "Not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const headers = Object.fromEntries(request.headers);

  let event: HookPayload;
  try {
    const wh = new Webhook(rawSecret.replace("v1,whsec_", ""));
    event = wh.verify(payload, headers) as HookPayload;
  } catch (err) {
    // Never log the raw payload/headers here — a forged or replayed request
    // could carry a real token_hash for another user's account.
    console.error("[email-hook] signature verification failed", err instanceof Error ? err.message : "unknown error");
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { user, email_data } = event;
  const actionUrl = buildActionUrl(email_data.token_hash, email_data.email_action_type, email_data.redirect_to);
  // Distinct idempotency key per token — Supabase redelivering the same
  // hook call carries the identical token_hash, so a retry is naturally a
  // no-op via email_events' unique constraint. Never logged (see
  // lib/email/send.ts) since it embeds the real token.
  const idempotencyKeySuffix = `${user.id}:${email_data.token_hash}`;

  try {
    switch (email_data.email_action_type) {
      case "signup": {
        await sendTransactionalEmail({
          idempotencyKey: `verify_email:${idempotencyKeySuffix}`,
          emailType: "verify_email",
          to: user.email,
          subject: "Confirm your WalletOS email",
          react: <VerifyEmailEmail confirmUrl={actionUrl} />,
          userId: user.id,
        });
        break;
      }
      case "recovery": {
        await sendTransactionalEmail({
          idempotencyKey: `reset_password:${idempotencyKeySuffix}`,
          emailType: "reset_password",
          to: user.email,
          subject: "Reset your WalletOS password",
          react: <ResetPasswordEmail resetUrl={actionUrl} />,
          userId: user.id,
        });
        break;
      }
      case "invite": {
        // Set by app/api/settings/team/route.ts's inviteUserByEmail() call
        // — Supabase forwards whatever metadata the invite was created
        // with straight through to this hook.
        const meta = user.user_metadata ?? {};
        const businessName = typeof meta.inviter_business_name === "string" ? meta.inviter_business_name : "WalletOS";
        const role = typeof meta.staff_role === "string" ? meta.staff_role : "team member";
        await sendTransactionalEmail({
          idempotencyKey: `team_invite:${idempotencyKeySuffix}`,
          emailType: "team_invite",
          to: user.email,
          subject: `You've been invited to join ${businessName} on WalletOS`,
          react: <TeamInviteEmail businessName={businessName} role={role} acceptUrl={actionUrl} />,
          userId: user.id,
        });
        break;
      }
      default:
        // magiclink / email_change / reauthentication / the notification-
        // only types — this app doesn't use any of them today. Returning
        // success (not an error) so an auth type we don't anticipate never
        // blocks the underlying Supabase operation; it just won't get a
        // custom email for that edge case.
        console.warn("[email-hook] unhandled email_action_type, no email sent", email_data.email_action_type);
    }
  } catch (err) {
    // sendTransactionalEmail already never throws for a Resend failure —
    // reaching here means something more fundamental broke (e.g. a bad
    // template render). Still respond 200: the auth operation itself
    // (account created, token issued) already succeeded and must not be
    // rolled back just because the confirmation email failed to send.
    console.error("[email-hook] unexpected error", err instanceof Error ? err.message : "unknown error");
  }

  return Response.json({});
}
