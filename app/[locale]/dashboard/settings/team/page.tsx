import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { TeamContent } from "@/components/dashboard/settings/team-content";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  const { data: staff } = await session.supabase
    .from("staff_accounts")
    .select("*")
    .eq("merchant_id", session.merchantId)
    .neq("status", "revoked")
    .order("created_at", { ascending: false });

  return <TeamContent staff={staff ?? []} />;
}
