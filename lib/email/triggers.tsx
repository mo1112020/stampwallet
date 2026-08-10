import { sendTransactionalEmail } from "@/lib/email/send";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerificationReminderEmail } from "@/components/emails/verification-reminder";
import { OnboardingNoProgramEmail } from "@/components/emails/onboarding-no-program";
import { UpgradePromptEmail } from "@/components/emails/upgrade-prompt";
import { ReengagementEmail } from "@/components/emails/reengagement";
import type { EmailPrefs } from "@/types";

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

const DAY_MS = 24 * 60 * 60 * 1000;

type MerchantRow = {
  id: string;
  business_name: string | null;
  plan: string;
  locale_default: string | null;
  email_prefs: EmailPrefs | null;
  created_at: string;
};

function marketingAllowed(prefs: EmailPrefs | null) {
  // Opt-out model, matching notification_prefs' convention — absent/null
  // key defaults to allowed, explicit false is the only thing that mutes it.
  return prefs?.marketing !== false;
}

/**
 * Daily sweep for the onboarding/re-engagement sequence — each rule is
 * independently idempotent (a merchant-scoped or merchant+period-scoped
 * idempotency key on email_events), so re-running this cron, or a merchant
 * satisfying a rule on consecutive days, never re-sends the same email
 * beyond its intended cooldown. Every rule here is a one-time nudge except
 * inactivity re-engagement, which re-fires at most once per calendar month.
 */
export async function evaluateEmailEngagementTriggers() {
  const admin = createAdminClient();
  const results = { verificationReminders: 0, noProgramNudges: 0, upgradePrompts: 0, reengagements: 0 };

  const { data: merchants } = await admin
    .from("merchants")
    .select("id, business_name, plan, locale_default, email_prefs, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (!merchants?.length) return results;

  const merchantRows = merchants as MerchantRow[];

  // ---- Rule A: still-unverified email, signed up >24h ago -------------
  // auth.users isn't queryable via postgrest — listUsers() is the only way
  // to read email_confirmed_at. A single page (up to 1000) is enough for
  // this app's current scale; revisit with pagination if that changes.
  const { data: userList } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const unconfirmedIds = new Set(
    (userList?.users ?? []).filter((u) => !u.email_confirmed_at).map((u) => u.id)
  );

  for (const merchant of merchantRows) {
    if (!unconfirmedIds.has(merchant.id)) continue;
    if (Date.now() - new Date(merchant.created_at).getTime() < DAY_MS) continue;
    const user = userList?.users.find((u) => u.id === merchant.id);
    if (!user?.email) continue;
    const resendUrl = `${appUrl()}/${merchant.locale_default ?? "en"}/login`;
    const result = await sendTransactionalEmail({
      idempotencyKey: `verification_reminder:${merchant.id}`,
      emailType: "verification_reminder",
      to: user.email,
      subject: "Confirm your email to activate WalletOS",
      react: <VerificationReminderEmail resendUrl={resendUrl} />,
      userId: merchant.id,
      merchantId: merchant.id,
    });
    if (result.sent) results.verificationReminders++;
  }

  // ---- Rule B: onboarded but no program created after 3 days ----------
  const threeDaysAgo = new Date(Date.now() - 3 * DAY_MS).toISOString();
  const noProgramCandidates = merchantRows.filter((m) => m.created_at <= threeDaysAgo);
  if (noProgramCandidates.length) {
    const { data: programOwners } = await admin
      .from("loyalty_programs")
      .select("merchant_id")
      .in("merchant_id", noProgramCandidates.map((m) => m.id));
    const hasProgram = new Set((programOwners ?? []).map((p) => p.merchant_id as string));

    for (const merchant of noProgramCandidates) {
      if (hasProgram.has(merchant.id)) continue;
      const { data: userData } = await admin.auth.admin.getUserById(merchant.id);
      if (!userData?.user?.email) continue;
      const result = await sendTransactionalEmail({
        idempotencyKey: `onboarding_no_program:${merchant.id}`,
        emailType: "onboarding_no_program",
        to: userData.user.email,
        subject: "Let's get your first WalletOS card live",
        react: (
          <OnboardingNoProgramEmail
            businessName={merchant.business_name}
            createProgramUrl={`${appUrl()}/${merchant.locale_default ?? "en"}/dashboard/programs/new`}
          />
        ),
        userId: merchant.id,
        merchantId: merchant.id,
      });
      if (result.sent) results.noProgramNudges++;
    }
  }

  // ---- Rule C: free plan, has a program, account >7 days old -----------
  const sevenDaysAgo = new Date(Date.now() - 7 * DAY_MS).toISOString();
  const freeCandidates = merchantRows.filter((m) => m.plan === "free" && m.created_at <= sevenDaysAgo && marketingAllowed(m.email_prefs));
  if (freeCandidates.length) {
    const { data: programOwners } = await admin
      .from("loyalty_programs")
      .select("merchant_id")
      .in("merchant_id", freeCandidates.map((m) => m.id));
    const hasProgram = new Set((programOwners ?? []).map((p) => p.merchant_id as string));

    for (const merchant of freeCandidates) {
      if (!hasProgram.has(merchant.id)) continue;
      const { data: userData } = await admin.auth.admin.getUserById(merchant.id);
      if (!userData?.user?.email) continue;
      const locale = merchant.locale_default ?? "en";
      const result = await sendTransactionalEmail({
        idempotencyKey: `upgrade_prompt:${merchant.id}`,
        emailType: "upgrade_prompt",
        to: userData.user.email,
        subject: "Your loyalty program is live — ready for more?",
        react: (
          <UpgradePromptEmail
            businessName={merchant.business_name}
            pricingUrl={`${appUrl()}/${locale}/pricing`}
            manageUrl={`${appUrl()}/${locale}/dashboard/settings/notifications`}
          />
        ),
        userId: merchant.id,
        merchantId: merchant.id,
      });
      if (result.sent) results.upgradePrompts++;
    }
  }

  // ---- Rule D: no scan activity in 14+ days, re-fires monthly -----------
  const fourteenDaysAgo = new Date(Date.now() - 14 * DAY_MS).toISOString();
  const monthBucket = new Date().toISOString().slice(0, 7); // yyyy-mm
  const activityCandidates = merchantRows.filter((m) => marketingAllowed(m.email_prefs));
  if (activityCandidates.length) {
    const { data: recentScans } = await admin
      .from("scan_events")
      .select("scanned_by")
      .in("scanned_by", activityCandidates.map((m) => m.id))
      .gte("created_at", fourteenDaysAgo);
    const recentlyActive = new Set((recentScans ?? []).map((s) => s.scanned_by as string));

    for (const merchant of activityCandidates) {
      if (recentlyActive.has(merchant.id)) continue;
      // Never target an account that's still mid-onboarding — no scans yet
      // isn't "went inactive," it's "hasn't started," already covered by
      // Rule B.
      if (merchant.created_at > fourteenDaysAgo) continue;
      const { data: userData } = await admin.auth.admin.getUserById(merchant.id);
      if (!userData?.user?.email) continue;
      const locale = merchant.locale_default ?? "en";
      const result = await sendTransactionalEmail({
        idempotencyKey: `reengagement_inactive:${merchant.id}:${monthBucket}`,
        emailType: "reengagement_inactive",
        to: userData.user.email,
        subject: "We haven't seen you in a while",
        react: (
          <ReengagementEmail
            businessName={merchant.business_name}
            dashboardUrl={`${appUrl()}/${locale}/dashboard`}
            manageUrl={`${appUrl()}/${locale}/dashboard/settings/notifications`}
          />
        ),
        userId: merchant.id,
        merchantId: merchant.id,
      });
      if (result.sent) results.reengagements++;
    }
  }

  return results;
}
