import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { BusinessForm } from "@/components/dashboard/settings/business-form";

export default async function BusinessMetricsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  return <BusinessForm merchant={session.merchant} />;
}
