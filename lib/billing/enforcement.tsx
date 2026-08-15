import { createAdminClient } from "@/lib/supabase/admin";
import { hasActiveAccess } from "@/lib/billing/access";
import { PLAN_LIMITS } from "@/lib/billing/plans";
import { sendTransactionalEmail } from "@/lib/email/send";
import { resolveSegmentTargets } from "@/lib/notifications/segments";
import { triggerAutomatedNotification } from "@/lib/notifications/campaigns";
import { BillingGraceWarningEmail } from "@/components/emails/billing-grace-warning";
import { BillingEnforcedEmail } from "@/components/emails/billing-enforced";
import type { CardAppearance } from "@/types";

/** Confirmed with the account owner: a short window between "subscription
 * genuinely canceled" (Stripe's own past_due retry window already ran, see
 * hasActiveAccess) and this taking effect, to absorb a same-week
 * resubscribe. */
export const BILLING_GRACE_PERIOD_DAYS = 3;

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

/** Card expiration is Paid-plan only (see PLAN_LIMITS.cardExpiration) — call
 * this whenever a merchant's plan drops to one without it (subscription
 * canceled/expired) so no program keeps showing expiry countdowns it's no
 * longer entitled to. */
export async function disableCardExpirationForMerchant(
  admin: ReturnType<typeof createAdminClient>,
  merchantId: string
) {
  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("id, config")
    .eq("merchant_id", merchantId);

  for (const program of programs ?? []) {
    const config = program.config as CardAppearance;
    if (!config.expiration?.enabled) continue;
    await admin
      .from("loyalty_programs")
      .update({ config: { ...config, expiration: { ...config.expiration, enabled: false } } })
      .eq("id", program.id);
  }
}

type EnforcementPlan = {
  survivorProgram: { id: string; name: string } | null;
  programsToDeactivate: { id: string; name: string }[];
  survivorLocation: { id: string; name: string } | null;
  locationsToDeactivate: { id: string; name: string }[];
  staffToSuspend: { id: string; invited_email: string }[];
};

/** What enforceBillingLimits() would do right now, without doing it — the
 * oldest active program/location survives (confirmed with the account
 * owner), everything else beyond it gets paused, and every non-revoked
 * staff row gets suspended (the Free plan's seat limit is 1 — the owner
 * only, see PLAN_LIMITS). Shared between the warning email (a preview) and
 * the actual enforcement run, so what a merchant is told matches exactly
 * what happens. */
async function planBillingEnforcement(
  admin: ReturnType<typeof createAdminClient>,
  merchantId: string
): Promise<EnforcementPlan> {
  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("id, name, created_at")
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const { data: locations } = await admin
    .from("store_locations")
    .select("id, name, created_at")
    .eq("merchant_id", merchantId)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const { data: staff } = await admin
    .from("staff_accounts")
    .select("id, invited_email")
    .eq("merchant_id", merchantId)
    .neq("status", "revoked")
    .eq("suspended_by_billing", false);

  const [survivorProgram, ...programsToDeactivate] = programs ?? [];
  const [survivorLocation, ...locationsToDeactivate] = locations ?? [];

  return {
    survivorProgram: survivorProgram ?? null,
    programsToDeactivate,
    survivorLocation: survivorLocation ?? null,
    locationsToDeactivate,
    staffToSuspend: staff ?? [],
  };
}

const FROZEN_MESSAGE =
  "This merchant's WalletOS subscription is currently inactive, so this program is paused. Ask them to resubscribe to keep earning rewards here.";
const RESTORED_MESSAGE = "This merchant's WalletOS subscription is active again — this program is back!";

/** Pushes one final wallet update (with a persistent status message, not
 * just a routine progress refresh) to every customer enrolled in a program
 * — must run BEFORE the program's is_active flips to false, since
 * resolveSegmentTargets only resolves currently-active programs. */
async function notifyProgramCustomers(
  merchantId: string,
  programId: string,
  trigger: "billing_paused" | "billing_restored",
  title: string,
  message: string
) {
  const targets = await resolveSegmentTargets(merchantId, { scope: "program", program_id: programId });
  for (const target of targets) {
    await triggerAutomatedNotification({ trigger, title, message, target, skipHeroImageRefresh: true });
  }
}

/** Called from the Stripe webhook the moment hasActiveAccess() transitions
 * true -> false. Starts the grace window and sends the detailed warning
 * email — this only warns, it doesn't change anything yet. */
export async function startBillingGrace(admin: ReturnType<typeof createAdminClient>, merchantId: string) {
  const graceEndsAt = new Date(Date.now() + BILLING_GRACE_PERIOD_DAYS * 24 * 60 * 60 * 1000);

  await admin
    .from("merchants")
    .update({ billing_grace_ends_at: graceEndsAt.toISOString(), billing_enforced_at: null })
    .eq("id", merchantId);

  const { data: merchant } = await admin.from("merchants").select("*").eq("id", merchantId).single();
  if (!merchant) return;
  const { data: userData } = await admin.auth.admin.getUserById(merchantId);
  if (!userData?.user?.email) return;

  const plan = await planBillingEnforcement(admin, merchantId);
  const limits = PLAN_LIMITS.free;
  const locale = merchant.locale_default ?? "en";

  await sendTransactionalEmail({
    idempotencyKey: `billing_grace_warning:${merchantId}:${graceEndsAt.toISOString()}`,
    emailType: "billing_grace_warning",
    to: userData.user.email,
    subject: `Action needed: your WalletOS plan changes in ${BILLING_GRACE_PERIOD_DAYS} days`,
    react: (
      <BillingGraceWarningEmail
        businessName={merchant.business_name}
        graceDays={BILLING_GRACE_PERIOD_DAYS}
        graceEndsAt={graceEndsAt.toISOString()}
        pricingUrl={`${appUrl()}/${locale}/pricing`}
        survivorProgramName={plan.survivorProgram?.name ?? null}
        pausedProgramCount={plan.programsToDeactivate.length}
        survivorLocationName={plan.survivorLocation?.name ?? null}
        pausedLocationCount={plan.locationsToDeactivate.length}
        suspendedStaffCount={plan.staffToSuspend.length}
        customerNotificationCap={limits.maxActiveCustomers ?? 0}
      />
    ),
    userId: merchantId,
    merchantId,
  });
}

/** Called from the daily cron sweep once a merchant's grace period has
 * passed and they still don't have active access. Idempotent via
 * billing_enforced_at — the sweep only selects merchants where it's still
 * null, and this sets it before returning. */
export async function enforceBillingLimits(merchantId: string): Promise<void> {
  const admin = createAdminClient();
  const { data: merchant } = await admin.from("merchants").select("*").eq("id", merchantId).single();
  if (!merchant) return;
  // Safety check, not the primary guard (the cron sweep's WHERE clause is)
  // — never enforce against a merchant whose access is actually active.
  if (hasActiveAccess(merchant.subscription_status)) return;

  const plan = await planBillingEnforcement(admin, merchantId);

  for (const program of plan.programsToDeactivate) {
    await notifyProgramCustomers(merchantId, program.id, "billing_paused", "Program paused", FROZEN_MESSAGE);
    await admin
      .from("loyalty_programs")
      .update({ is_active: false, deactivated_by_billing: true })
      .eq("id", program.id);
  }

  for (const location of plan.locationsToDeactivate) {
    await admin
      .from("store_locations")
      .update({ is_active: false, deactivated_by_billing: true })
      .eq("id", location.id);
  }

  for (const staff of plan.staffToSuspend) {
    await admin.from("staff_accounts").update({ suspended_by_billing: true }).eq("id", staff.id);
  }

  await admin.from("merchants").update({ billing_enforced_at: new Date().toISOString() }).eq("id", merchantId);

  const { data: userData } = await admin.auth.admin.getUserById(merchantId);
  if (!userData?.user?.email) return;
  const locale = merchant.locale_default ?? "en";
  const limits = PLAN_LIMITS.free;

  await sendTransactionalEmail({
    idempotencyKey: `billing_enforced:${merchantId}:${new Date().toISOString().slice(0, 10)}`,
    emailType: "billing_enforced",
    to: userData.user.email,
    subject: "Your WalletOS account has been moved to the Free plan",
    react: (
      <BillingEnforcedEmail
        businessName={merchant.business_name}
        pricingUrl={`${appUrl()}/${locale}/pricing`}
        survivorProgramName={plan.survivorProgram?.name ?? null}
        pausedProgramNames={plan.programsToDeactivate.map((p) => p.name)}
        survivorLocationName={plan.survivorLocation?.name ?? null}
        pausedLocationCount={plan.locationsToDeactivate.length}
        suspendedStaffCount={plan.staffToSuspend.length}
        customerNotificationCap={limits.maxActiveCustomers ?? 0}
      />
    ),
    userId: merchantId,
    merchantId,
  });
}

/** Called from the Stripe webhook the moment hasActiveAccess() transitions
 * false -> true (resubscribe, at any point — mid-grace-period or after full
 * enforcement already ran). Reverses exactly what enforceBillingLimits()
 * turned off, nothing the merchant had already archived themselves. */
export async function restoreBillingLimits(admin: ReturnType<typeof createAdminClient>, merchantId: string) {
  const { data: programs } = await admin
    .from("loyalty_programs")
    .select("id")
    .eq("merchant_id", merchantId)
    .eq("deactivated_by_billing", true);

  for (const program of programs ?? []) {
    await admin
      .from("loyalty_programs")
      .update({ is_active: true, deactivated_by_billing: false })
      .eq("id", program.id);
    await notifyProgramCustomers(merchantId, program.id, "billing_restored", "Program restored", RESTORED_MESSAGE);
  }

  await admin
    .from("store_locations")
    .update({ is_active: true, deactivated_by_billing: false })
    .eq("merchant_id", merchantId)
    .eq("deactivated_by_billing", true);

  await admin
    .from("staff_accounts")
    .update({ suspended_by_billing: false })
    .eq("merchant_id", merchantId)
    .eq("suspended_by_billing", true);

  await admin
    .from("merchants")
    .update({ billing_grace_ends_at: null, billing_enforced_at: null })
    .eq("id", merchantId);
}

/**
 * Daily cron sweep (see app/api/cron/billing-enforcement/route.ts) — finds
 * every merchant whose grace period has passed, still doesn't have active
 * access (re-checked here, not just trusted from when the grace period
 * started), and hasn't been enforced yet for this lapse, then runs
 * enforceBillingLimits() for each. billing_enforced_at is what makes this
 * safe to run daily without repeating the same enforcement.
 */
export async function sweepExpiredBillingGrace(): Promise<{ enforced: number; merchantIds: string[] }> {
  const admin = createAdminClient();
  const { data: merchants } = await admin
    .from("merchants")
    .select("id, subscription_status")
    .not("billing_grace_ends_at", "is", null)
    .is("billing_enforced_at", null)
    .lte("billing_grace_ends_at", new Date().toISOString());

  const merchantIds: string[] = [];
  for (const merchant of merchants ?? []) {
    if (hasActiveAccess(merchant.subscription_status)) continue; // resubscribed since the sweep query ran
    await enforceBillingLimits(merchant.id);
    merchantIds.push(merchant.id);
  }

  return { enforced: merchantIds.length, merchantIds };
}
