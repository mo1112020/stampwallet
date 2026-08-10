import { EmailCta, EmailDivider, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function WelcomeEmail({ name, dashboardUrl }: { name?: string | null; dashboardUrl: string }) {
  return (
    <EmailLayout previewText="Welcome to WalletOS — let's get your first loyalty card live.">
      <EmailGreeting name={name} />
      <EmailHeading>Welcome to WalletOS</EmailHeading>
      <EmailText>
        WalletOS turns your Apple and Google Wallet into a loyalty card platform — no app for your
        customers to download, no plastic cards to print. Stamps and points update on their phone the
        moment your staff scan them.
      </EmailText>
      <EmailCta href={dashboardUrl} label="Open your dashboard" />
      <EmailDivider />
      <EmailText muted>Here's how most merchants get started:</EmailText>
      <EmailText>1. Create a loyalty program (stamp card, points, or a reward journey)</EmailText>
      <EmailText>2. Customize the card with your logo and brand colors</EmailText>
      <EmailText>3. Invite your team so staff can scan customers</EmailText>
      <EmailText>4. Start enrolling customers — one scan and their card is in their wallet</EmailText>
    </EmailLayout>
  );
}

export default WelcomeEmail;
