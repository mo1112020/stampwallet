import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function SubscriptionCanceledEmail({
  businessName,
  pricingUrl,
}: {
  businessName?: string | null;
  pricingUrl: string;
}) {
  return (
    <EmailLayout previewText="Your WalletOS subscription has ended.">
      <EmailGreeting name={businessName} />
      <EmailHeading>Your subscription has ended</EmailHeading>
      <EmailText>
        Your WalletOS subscription is no longer active and your account is now on the Free plan.
        Your programs and customer data are safe — nothing was deleted.
      </EmailText>
      <EmailCta href={pricingUrl} label="Resubscribe" />
      <EmailText muted>We'd love to have you back whenever you're ready.</EmailText>
    </EmailLayout>
  );
}

export default SubscriptionCanceledEmail;
