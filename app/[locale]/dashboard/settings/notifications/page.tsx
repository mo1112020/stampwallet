import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { NotificationsPrefsForm } from "@/components/dashboard/settings/notifications-prefs-form";
import { EmailPrefsForm } from "@/components/dashboard/settings/email-prefs-form";

export default async function NotificationsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  return (
    <div className="space-y-10">
      <NotificationsPrefsForm initialPrefs={session.merchant.notification_prefs ?? {}} />
      <EmailPrefsForm initialPrefs={session.merchant.email_prefs ?? {}} />
    </div>
  );
}
