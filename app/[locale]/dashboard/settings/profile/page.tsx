import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { ProfileForm } from "@/components/dashboard/settings/profile-form";

export default async function ProfileSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  return <ProfileForm merchant={session.merchant} />;
}
