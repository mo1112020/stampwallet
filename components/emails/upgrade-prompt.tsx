import { EmailCta, EmailDivider, EmailGreeting, EmailHeading, EmailLayout, EmailText, EmailUnsubscribeFooter } from "@/components/emails/layout";

export function UpgradePromptEmail({
  businessName,
  pricingUrl,
  manageUrl,
}: {
  businessName?: string | null;
  pricingUrl: string;
  manageUrl: string;
}) {
  return (
    <EmailLayout previewText="You're getting real use out of WalletOS — here's what upgrading unlocks.">
      <EmailGreeting name={businessName} />
      <EmailHeading>Your loyalty program is live — ready for more?</EmailHeading>
      <EmailText>
        You're on the Free plan with a program up and running. When you're ready to grow, Starter and
        Pro unlock:
      </EmailText>
      <EmailText>• More active programs and a higher customer cap</EmailText>
      <EmailText>• Custom branding on every wallet card</EmailText>
      <EmailText>• Card expiration for time-limited rewards</EmailText>
      <EmailCta href={pricingUrl} label="See plans" />
      <EmailDivider />
      <EmailUnsubscribeFooter manageUrl={manageUrl} />
    </EmailLayout>
  );
}

export default UpgradePromptEmail;
