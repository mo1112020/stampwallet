import { EmailCta, EmailDivider, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export function BillingGraceWarningEmail({
  businessName,
  graceDays,
  graceEndsAt,
  pricingUrl,
  survivorProgramName,
  pausedProgramCount,
  survivorLocationName,
  pausedLocationCount,
  suspendedStaffCount,
  customerNotificationCap,
}: {
  businessName?: string | null;
  graceDays: number;
  graceEndsAt: string;
  pricingUrl: string;
  survivorProgramName: string | null;
  pausedProgramCount: number;
  survivorLocationName: string | null;
  pausedLocationCount: number;
  suspendedStaffCount: number;
  customerNotificationCap: number;
}) {
  const nothingToPause =
    pausedProgramCount === 0 && pausedLocationCount === 0 && suspendedStaffCount === 0;

  return (
    <EmailLayout previewText={`Your WalletOS plan changes in ${graceDays} days unless you resubscribe.`}>
      <EmailGreeting name={businessName} />
      <EmailHeading>Your subscription has ended</EmailHeading>
      <EmailText>
        Your WalletOS subscription is no longer active. You have <strong>{graceDays} days</strong> — until{" "}
        <strong>{formatDate(graceEndsAt)}</strong> — to resubscribe before your account is moved onto the Free
        plan's limits. Nothing has changed yet, and nothing will be deleted — this is exactly what will happen if
        the {graceDays}-day window passes:
      </EmailText>

      {!nothingToPause && (
        <>
          <EmailDivider />
          {survivorProgramName && (
            <EmailText>
              <strong>Programs:</strong> only <strong>{survivorProgramName}</strong> (your oldest) will stay
              active.
              {pausedProgramCount > 0 &&
                ` ${pausedProgramCount} other program${pausedProgramCount === 1 ? "" : "s"} will be paused — hidden from new enrollment, and existing customers' wallet passes will stop updating (nothing is deleted, and it's all reversible the moment you resubscribe).`}
            </EmailText>
          )}
          {survivorLocationName && pausedLocationCount > 0 && (
            <EmailText>
              <strong>Locations:</strong> only <strong>{survivorLocationName}</strong> will stay active.{" "}
              {pausedLocationCount} other location{pausedLocationCount === 1 ? "" : "s"} will be paused.
            </EmailText>
          )}
          {suspendedStaffCount > 0 && (
            <EmailText>
              <strong>Team:</strong> the Free plan includes just your own owner account —{" "}
              {suspendedStaffCount} staff member{suspendedStaffCount === 1 ? "" : "s"} will temporarily lose
              access until you resubscribe.
            </EmailText>
          )}
          <EmailText>
            <strong>Wallet updates:</strong> live pass updates (new stamps, reward status) will only keep working
            for your first {customerNotificationCap} enrolled customers on the program that stays active.
          </EmailText>
          <EmailDivider />
        </>
      )}

      <EmailCta href={pricingUrl} label="Resubscribe" />
      <EmailText muted>
        Everything reverses automatically the moment you resubscribe — no need to contact support.
      </EmailText>
    </EmailLayout>
  );
}

export default BillingGraceWarningEmail;
