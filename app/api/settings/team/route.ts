import { jsonError, jsonOk, requireCapability } from "@/lib/api";
import { PLAN_LIMITS, isWithinLimit } from "@/lib/billing/plans";
import { createAdminClient } from "@/lib/supabase/admin";
import { inviteStaffSchema } from "@/lib/validators";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
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

  // A previously-revoked staff member already has a real Supabase Auth user
  // from their original invite (revoking only flips staff_accounts.status —
  // see [staffId]/route.ts's DELETE handler — it never touches the auth
  // user). inviteUserByEmail() below only works for brand-new identities,
  // so re-inviting the same email failed with Supabase's own "user already
  // registered" error, surfacing to the merchant as a confusing "already
  // assigned" message even though they're trying to bring someone BACK, not
  // create a duplicate. Reactivate the existing row instead and send a
  // fresh password-reset link (also forces a new password after a revoke,
  // which is the safer default anyway) rather than a second invite.
  const { data: existingRow } = await admin
    .from("staff_accounts")
    .select("id, status, user_id")
    .eq("merchant_id", auth.merchantId)
    .eq("invited_email", parsed.data.email)
    .maybeSingle();

  if (existingRow && existingRow.status !== "revoked") {
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

    return jsonOk(staffRow, 200);
  }

  // is_staff_invite tells handle_new_user() (migration 001/007) to skip
  // auto-creating a merchants "owner" row for this identity — this person
  // is staff of auth.merchantId, not an owner of their own account.
  // inviter_business_name/staff_role ride along as user_metadata purely so
  // the Supabase "Send Email" hook (app/api/auth/email-hook) can render a
  // branded invite email without a separate DB lookup — Supabase forwards
  // this metadata straight through to the hook payload.
  // Without an explicit redirectTo, Supabase falls back to the project's
  // Site URL, and the token_hash forwarded to our email hook carries no
  // destination — becomes the `next` param on app/auth/confirm, which
  // verifyOtp uses to land the now-signed-in staff member on the
  // set-password page instead of the marketing homepage.
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        is_staff_invite: true,
        inviter_business_name: auth.merchant.business_name,
        staff_role: parsed.data.role,
      },
      redirectTo: `${appUrl()}/${locale}/reset-password`,
    }
  );

  if (inviteError || !invited?.user) {
    return jsonError(inviteError?.message ?? "Could not invite that email", "invite_failed", 400);
  }

  const { data: staffRow, error: insertError } = await admin
    .from("staff_accounts")
    .insert({
      user_id: invited.user.id,
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

  return jsonOk(staffRow, 201);
}
