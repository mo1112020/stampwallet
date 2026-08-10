import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function ResetPasswordEmail({ resetUrl }: { resetUrl: string }) {
  return (
    <EmailLayout previewText="Reset your WalletOS password.">
      <EmailGreeting />
      <EmailHeading>Reset your password</EmailHeading>
      <EmailText>
        We got a request to reset the password on your WalletOS account. Click below to choose a new
        one. This link expires soon.
      </EmailText>
      <EmailCta href={resetUrl} label="Reset password" />
      <EmailText muted>
        If you didn't request this, you can safely ignore this email — your password won't change.
      </EmailText>
    </EmailLayout>
  );
}

export default ResetPasswordEmail;
