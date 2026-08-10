import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function SubscriptionRenewedEmail({
  businessName,
  plan,
  amount,
  currency,
  invoiceUrl,
  dashboardUrl,
}: {
  businessName?: string | null;
  plan: string;
  amount: number;
  currency: string;
  invoiceUrl?: string | null;
  dashboardUrl: string;
}) {
  const formatted = new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(amount / 100);
  return (
    <EmailLayout previewText={`Your WalletOS ${plan} plan renewed — ${formatted}.`}>
      <EmailGreeting name={businessName} />
      <EmailHeading>Your subscription renewed</EmailHeading>
      <EmailText>
        Your WalletOS <strong>{plan}</strong> plan renewed for <strong>{formatted}</strong>. No action
        needed — you're all set.
      </EmailText>
      <EmailCta href={invoiceUrl ?? dashboardUrl} label={invoiceUrl ? "View invoice" : "Open dashboard"} />
    </EmailLayout>
  );
}

export default SubscriptionRenewedEmail;
