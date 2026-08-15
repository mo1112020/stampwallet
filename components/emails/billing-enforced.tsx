import { EmailCta, EmailDivider, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function BillingEnforcedEmail({
  businessName,
  pricingUrl,
  survivorProgramName,
  pausedProgramNames,
  survivorLocationName,
  pausedLocationCount,
  suspendedStaffCount,
  customerNotificationCap,
}: {
  businessName?: string | null;
  pricingUrl: string;
  survivorProgramName: string | null;
  pausedProgramNames: string[];
  survivorLocationName: string | null;
  pausedLocationCount: number;
  suspendedStaffCount: number;
  customerNotificationCap: number;
}) {
  return (
    <EmailLayout previewText="Your WalletOS account has been moved to the Free plan — here's exactly what changed.">
      <EmailGreeting name={businessName} />
      <EmailHeading>Your account is now on the Free plan</EmailHeading>
      <EmailText>
        Your grace period ended without a resubscription, so your account has been moved onto the Free plan's
        limits. Nothing was deleted — here's exactly what changed:
      </EmailText>

      <EmailDivider />
      {survivorProgramName && (
        <EmailText>
          <strong>Programs:</strong> <strong>{survivorProgramName}</strong> is still active.
          {pausedProgramNames.length > 0 &&
            ` ${pausedProgramNames.join(", ")} ${pausedProgramNames.length === 1 ? "has" : "have"} been paused — hidden from new enrollment, and existing customers' wallet passes have stopped updating.`}
        </EmailText>
      )}
      {survivorLocationName && pausedLocationCount > 0 && (
        <EmailText>
          <strong>Locations:</strong> <strong>{survivorLocationName}</strong> is still active. {pausedLocationCount}{" "}
          other location{pausedLocationCount === 1 ? "" : "s"} {pausedLocationCount === 1 ? "has" : "have"} been
          paused.
        </EmailText>
      )}
      {suspendedStaffCount > 0 && (
        <EmailText>
          <strong>Team:</strong> {suspendedStaffCount} staff member{suspendedStaffCount === 1 ? "" : "s"}{" "}
          {suspendedStaffCount === 1 ? "has" : "have"} temporarily lost access.
        </EmailText>
      )}
      <EmailText>
        <strong>Wallet updates:</strong> live pass updates now only reach your first {customerNotificationCap}{" "}
        enrolled customers on {survivorProgramName ?? "your active program"}.
      </EmailText>
      <EmailDivider />

      <EmailCta href={pricingUrl} label="Resubscribe to restore everything" />
      <EmailText muted>
        Resubscribing reactivates every paused program and location, restores staff access, and resumes wallet
        updates immediately — nothing to reconfigure.
      </EmailText>
    </EmailLayout>
  );
}

export default BillingEnforcedEmail;
