import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function PaymentFailedEmail({
  businessName,
  portalUrl,
}: {
  businessName?: string | null;
  portalUrl: string;
}) {
  return (
    <EmailLayout previewText="A payment on your WalletOS subscription failed.">
      <EmailGreeting name={businessName} />
      <EmailHeading>We couldn't process your payment</EmailHeading>
      <EmailText>
        A payment on your WalletOS subscription didn't go through. Your access continues for now, but
        please update your payment method soon to avoid any interruption.
      </EmailText>
      <EmailCta href={portalUrl} label="Update payment method" />
      <EmailText muted>We'll automatically retry the payment over the next few days.</EmailText>
    </EmailLayout>
  );
}

export default PaymentFailedEmail;
