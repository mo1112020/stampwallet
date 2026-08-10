import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function PlanChangedEmail({
  businessName,
  fromPlan,
  toPlan,
  isUpgrade,
  dashboardUrl,
}: {
  businessName?: string | null;
  fromPlan: string;
  toPlan: string;
  isUpgrade: boolean;
  dashboardUrl: string;
}) {
  return (
    <EmailLayout previewText={`Your WalletOS plan changed to ${toPlan}.`}>
      <EmailGreeting name={businessName} />
      <EmailHeading>{isUpgrade ? "Your plan was upgraded" : "Your plan was changed"}</EmailHeading>
      <EmailText>
        Your WalletOS subscription moved from <strong>{fromPlan}</strong> to <strong>{toPlan}</strong>.
        {isUpgrade ? " Your new limits are already active." : " Your new plan takes effect at your next renewal."}
      </EmailText>
      <EmailCta href={dashboardUrl} label="Open dashboard" />
    </EmailLayout>
  );
}

export default PlanChangedEmail;
