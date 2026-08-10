import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function OnboardingNoProgramEmail({
  businessName,
  createProgramUrl,
}: {
  businessName?: string | null;
  createProgramUrl: string;
}) {
  return (
    <EmailLayout previewText="Your WalletOS account is ready — create your first loyalty program.">
      <EmailGreeting name={businessName} />
      <EmailHeading>Let's get your first card live</EmailHeading>
      <EmailText>
        Your WalletOS account is set up, but you haven't created a loyalty program yet. It takes about
        two minutes — pick a stamp card, points, or a multi-stage reward journey, and you'll have a
        live enrollment QR ready to put on your counter.
      </EmailText>
      <EmailCta href={createProgramUrl} label="Create your first program" />
    </EmailLayout>
  );
}

export default OnboardingNoProgramEmail;
