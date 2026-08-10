import { jsonError, jsonOk } from "@/lib/api";
import { sendTransactionalEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { WelcomeEmail } from "@/components/emails/welcome";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/**
 * Called client-side right after supabase.auth.signUp() succeeds (see
 * app/[locale]/signup/page.tsx) to send the welcome email. Deliberately not
 * gated on an authenticated session — if the Supabase project requires
 * email confirmation, signUp() doesn't return a session until the user
 * confirms, so there's nothing to check a session against yet. userId comes
 * from signUp()'s own response (a value only obtainable by actually calling
 * Supabase's signUp), and the idempotency key on email_events means calling
 * this twice for the same user (retry, page refresh) sends the welcome
 * email at most once regardless.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const userId = body?.userId;
  if (!userId || typeof userId !== "string") {
    return jsonError("Missing userId", "validation_error", 400);
  }

  const admin = createAdminClient();

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(userId);
  if (userError || !userData?.user?.email) {
    return jsonError("User not found", "not_found", 404);
  }

  const { data: merchant } = await admin
    .from("merchants")
    .select("business_name, locale_default")
    .eq("id", userId)
    .maybeSingle();

  const locale = merchant?.locale_default ?? "en";
  const dashboardUrl = `${appUrl()}/${locale}/dashboard`;
  const name = merchant?.business_name || (userData.user.user_metadata?.first_name as string | undefined) || null;

  const result = await sendTransactionalEmail({
    idempotencyKey: `welcome:${userId}`,
    emailType: "welcome",
    to: userData.user.email,
    subject: "Welcome to WalletOS",
    react: <WelcomeEmail name={name} dashboardUrl={dashboardUrl} />,
    userId,
    merchantId: userId,
  });

  // Always 200 — a failed/skipped welcome email must never surface as a
  // signup error to the merchant. jsonOk's payload is purely informational.
  return jsonOk({ sent: result.sent, skipped: !result.sent && "skipped" in result ? result.skipped : false });
}
