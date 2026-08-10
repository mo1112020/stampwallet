import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function VerificationReminderEmail({ resendUrl }: { resendUrl: string }) {
  return (
    <EmailLayout previewText="Your WalletOS account isn't verified yet.">
      <EmailGreeting />
      <EmailHeading>Don't forget to confirm your email</EmailHeading>
      <EmailText>
        You created a WalletOS account but haven't confirmed your email yet. Confirm it to make sure
        you never lose access to your account.
      </EmailText>
      <EmailCta href={resendUrl} label="Resend confirmation email" />
    </EmailLayout>
  );
}

export default VerificationReminderEmail;
