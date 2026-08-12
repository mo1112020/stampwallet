import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { PLAN_LIMITS, isWithinLimit } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteStaffSchema } from "@/lib/validators";
import { sendTransactionalEmail } from "@/lib/email/send";
import { TeamInviteEmail } from "@/components/emails/team-invite";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Same construction as app/api/auth/email-hook/route.tsx's buildActionUrl —
 * our own /auth/confirm (verifyOtp) rather than Supabase's hosted
 * /auth/v1/verify, since that redirects back via a PKCE `code` that only
 * exchanges successfully on the same browser/device that requested it, and
 * invite links are routinely opened in a phone's email app instead. */
function buildActionUrl(tokenHash: string, actionType: string, redirectTo: string) {
  const url = new URL(`${appUrl()}/auth/confirm`);
  url.searchParams.set("token_hash", tokenHash);
  url.searchParams.set("type", actionType);
  url.searchParams.set("next", redirectTo);
  return url.toString();
}

export async function GET() {
  const auth = await requireCapability("manage_staff");
  if ("error" in auth) return auth.error;

  const { data, error } = await auth.supabase
    .from("staff_accounts")
    .select("*")
    .eq("merchant_id", auth.merchantId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  if (error) return jsonError(error.message, "list_failed", 500);
  return jsonOk(data);
}

export async function POST(request: Request) {
  const auth = await requireCapability("manage_staff");
  if ("error" in auth) return auth.error;

  const body = await request.json();
  const parsed = inviteStaffSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.message, "validation_error", 400);
  }

  const limits = PLAN_LIMITS[auth.merchant.plan];
  const { count } = await auth.supabase
    .from("staff_accounts")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", auth.merchantId)
    .neq("status", "revoked");

  // +1 for the owner's own seat.
  const seatsUsed = (count ?? 0) + 1;
  if (!isWithinLimit(seatsUsed, limits.maxSeats)) {
    return jsonError(
      `Your ${auth.merchant.plan} plan allows ${limits.maxSeats} seat(s). Upgrade to invite more staff.`,
      "plan_limit",
      403
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return jsonError("Server is not configured with Supabase service role", "misconfigured", 503);
  }

  const locale = auth.merchant.locale_default || "en";

  // A previously-invited-or-revoked staff member already has a real
  // Supabase Auth user (revoking only flips staff_accounts.status — see
  // [staffId]/route.ts's DELETE handler — it never touches the auth user;
  // and "invited" means they have one but never finished accepting it).
  // generateLink({type:"invite"}) below only creates brand-new identities,
  // so re-inviting either kind of existing email would fail with Supabase's
  // own "user already registered" error, surfacing to the merchant as a
  // confusing "already assigned" message — even for the completely
  // reasonable case of re-sending an invite that silently never arrived.
  // Reactivate the existing row and send a fresh password-reset link
  // (proven reliable in production, unlike the invite-hook path this
  // route used to depend on) instead of a second invite. Only a genuinely
  // "active" (already accepted) member is a real duplicate.
  const { data: existingRow } = await admin
    .from("staff_accounts")
    .select("id, status, user_id")
    .eq("merchant_id", auth.merchantId)
    .eq("invited_email", parsed.data.email)
    .maybeSingle();

  if (existingRow && existingRow.status === "active") {
    return jsonError("This person is already on your team.", "already_member", 409);
  }

  if (existingRow) {
    const { data: staffRow, error: reactivateError } = await admin
      .from("staff_accounts")
      .update({ role: parsed.data.role, status: "invited" })
      .eq("id", existingRow.id)
      .select("*")
      .single();

    if (reactivateError || !staffRow) {
      return jsonError(reactivateError?.message ?? "Could not reactivate staff record", "reactivate_failed", 500);
    }

    const { error: resetError } = await admin.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${appUrl()}/${locale}/reset-password`,
    });
    if (resetError) {
      console.error("[team:reinvite] password-reset link send failed", resetError.message);
    }

    return jsonOk({ ...staffRow, email_sent: !resetError }, 200);
  }

  // is_staff_invite tells handle_new_user() (migration 001/007) to skip
  // auto-creating a merchants "owner" row for this identity — this person
  // is staff of auth.merchantId, not an owner of their own account.
  // Without an explicit redirectTo, Supabase falls back to the project's
  // Site URL, and the token_hash carries no destination — becomes the
  // `next` param on app/auth/confirm, which verifyOtp uses to land the
  // now-signed-in staff member on the set-password page instead of the
  // marketing homepage.
  //
  // Previously used inviteUserByEmail() and relied on Supabase's "Send
  // Email" Auth Hook to deliver the invite (app/api/auth/email-hook —
  // still used for recovery/signup, which do fire reliably). In production,
  // every real staff invite silently never sent: the user row was created
  // successfully, but no email_events row for "team_invite" was ever
  // recorded — the hook simply never ran for this action type, with no
  // error surfaced anywhere on our side to explain why. generateLink()
  // creates the same user but returns the token directly, so the email is
  // sent right here instead of depending on that hook firing at all —
  // this is now directly observable (a queued/sent/failed email_events row
  // every time) rather than a silent gap.
  const redirectTo = `${appUrl()}/${locale}/reset-password`;
  const { data: generated, error: generateError } = await admin.auth.admin.generateLink({
    type: "invite",
    email: parsed.data.email,
    options: {
      data: {
        is_staff_invite: true,
        inviter_business_name: auth.merchant.business_name,
        staff_role: parsed.data.role,
      },
      redirectTo,
    },
  });

  if (generateError || !generated?.user) {
    return jsonError(generateError?.message ?? "Could not invite that email", "invite_failed", 400);
  }

  const { data: staffRow, error: insertError } = await admin
    .from("staff_accounts")
    .insert({
      user_id: generated.user.id,
      merchant_id: auth.merchantId,
      role: parsed.data.role,
      status: "invited",
      invited_email: parsed.data.email,
    })
    .select("*")
    .single();

  if (insertError || !staffRow) {
    return jsonError(insertError?.message ?? "Could not create staff record", "create_failed", 500);
  }

  const actionUrl = buildActionUrl(generated.properties.hashed_token, "invite", redirectTo);
  const emailResult = await sendTransactionalEmail({
    idempotencyKey: `team_invite:${generated.user.id}:${generated.properties.hashed_token}`,
    emailType: "team_invite",
    to: parsed.data.email,
    subject: `You've been invited to join ${auth.merchant.business_name} on WalletOS`,
    react: <TeamInviteEmail businessName={auth.merchant.business_name} role={parsed.data.role} acceptUrl={actionUrl} />,
    userId: generated.user.id,
    merchantId: auth.merchantId,
  });

  if (!emailResult.sent) {
    // The staff record and auth user already exist — don't fail the whole
    // request over a delivery hiccup, but the merchant needs to know the
    // email didn't go out so they're not left waiting on nothing.
    console.error("[team:invite] invite email failed to send", parsed.data.email, emailResult.skipped ? "skipped" : emailResult.error);
    return jsonOk({ ...staffRow, email_sent: false }, 201);
  }

  return jsonOk({ ...staffRow, email_sent: true }, 201);
}
