import { EmailCta, EmailDivider, EmailGreeting, EmailHeading, EmailLayout, EmailText, EmailUnsubscribeFooter } from "@/components/emails/layout";

export function ReengagementEmail({
  businessName,
  dashboardUrl,
  manageUrl,
}: {
  businessName?: string | null;
  dashboardUrl: string;
  manageUrl: string;
}) {
  return (
    <EmailLayout previewText="It's been a while — your WalletOS loyalty program is still here.">
      <EmailGreeting name={businessName} />
      <EmailHeading>We haven't seen you in a while</EmailHeading>
      <EmailText>
        Your WalletOS account and loyalty program are still active, waiting for you. If something's
        not working the way you expected, we'd genuinely like to help.
      </EmailText>
      <EmailCta href={dashboardUrl} label="Open your dashboard" />
      <EmailDivider />
      <EmailUnsubscribeFooter manageUrl={manageUrl} />
    </EmailLayout>
  );
}

export default ReengagementEmail;
