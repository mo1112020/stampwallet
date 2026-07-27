import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { BrandingForm } from "@/components/dashboard/settings/branding-form";

export default async function BrandingSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  return <BrandingForm merchant={session.merchant} />;
}
