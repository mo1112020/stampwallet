import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { DataActions } from "@/components/dashboard/settings/data-actions";

export default async function DataSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  return <DataActions businessName={session.merchant.business_name} />;
}
