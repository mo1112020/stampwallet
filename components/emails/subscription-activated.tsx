import { EmailCta, EmailDivider, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

const PLAN_BENEFITS: Record<string, string[]> = {
  starter: ["3 active loyalty programs", "1,000 customers", "Custom branding", "Card expiration"],
  pro: ["20 active loyalty programs", "10,000 customers", "Custom branding", "Card expiration"],
};

export function SubscriptionActivatedEmail({
  businessName,
  plan,
  dashboardUrl,
}: {
  businessName?: string | null;
  plan: string;
  dashboardUrl: string;
}) {
  const benefits = PLAN_BENEFITS[plan] ?? [];
  return (
    <EmailLayout previewText={`You're on the ${plan} plan — here's what's unlocked.`}>
      <EmailGreeting name={businessName} />
      <EmailHeading>Welcome to {plan[0].toUpperCase() + plan.slice(1)}</EmailHeading>
      <EmailText>
        Your WalletOS subscription is active. Thanks for upgrading — here's what's now unlocked:
      </EmailText>
      {benefits.map((b) => (
        <EmailText key={b}>• {b}</EmailText>
      ))}
      <EmailCta href={dashboardUrl} label="Open your dashboard" />
      <EmailDivider />
      <EmailText muted>
        You can manage your subscription, update your payment method, or view invoices anytime from
        Billing in your dashboard.
      </EmailText>
    </EmailLayout>
  );
}

export default SubscriptionActivatedEmail;
