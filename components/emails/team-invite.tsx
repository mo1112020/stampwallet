import { EmailCta, EmailGreeting, EmailHeading, EmailLayout, EmailText } from "@/components/emails/layout";

export function TeamInviteEmail({
  businessName,
  role,
  acceptUrl,
}: {
  businessName: string;
  role: string;
  acceptUrl: string;
}) {
  return (
    <EmailLayout previewText={`You've been invited to join ${businessName} on WalletOS.`}>
      <EmailGreeting />
      <EmailHeading>You've been invited to {businessName}</EmailHeading>
      <EmailText>
        You've been invited to join <strong>{businessName}</strong>'s team on WalletOS as{" "}
        <strong>{role}</strong>. Accept the invite to get access to the dashboard.
      </EmailText>
      <EmailCta href={acceptUrl} label="Accept invitation" />
      <EmailText muted>
        If you weren't expecting this invitation, you can safely ignore this email.
      </EmailText>
    </EmailLayout>
  );
}

export default TeamInviteEmail;
