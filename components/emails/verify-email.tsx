import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function VerifyEmailEmail({ confirmUrl }: { confirmUrl: string }) {
  return (
    <EmailLayout previewText="Confirm your email to activate your WalletOS account.">
      <EmailGreeting />
      <EmailHeading>Confirm your email</EmailHeading>
      <EmailText>
        Click below to confirm your email address and activate your WalletOS account. This link
        expires soon, so confirm it now if you're ready to go.
      </EmailText>
      <EmailCta href={confirmUrl} label="Confirm email" />
      <EmailText muted>If you didn't create a WalletOS account, you can safely ignore this email.</EmailText>
    </EmailLayout>
  );
}

export default VerifyEmailEmail;
