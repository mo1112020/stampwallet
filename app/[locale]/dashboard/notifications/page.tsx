import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSessionOrNull } from "@/lib/api";
import { roleHasCapability } from "@/lib/auth/permissions";
import { NotificationsContent } from "@/components/dashboard/notifications-content";

export default async function NotificationsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("notifications");

  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  if (!roleHasCapability(session.role, "manage_settings")) {
    return (
      <div className="max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">{t("noAccess")}</p>
      </div>
    );
  }

  const [{ data: campaigns }, { data: programs }] = await Promise.all([
    session.supabase
      .from("notification_campaigns")
      .select("*")
      .eq("merchant_id", session.merchantId)
      .order("created_at", { ascending: false })
      .limit(50),
    session.supabase.from("loyalty_programs").select("id, name").eq("merchant_id", session.merchantId),
  ]);

  return (
    <NotificationsContent
      locale={locale}
      campaigns={campaigns ?? []}
      programs={programs ?? []}
      merchant={{ business_name: session.merchant.business_name, logo_url: session.merchant.logo_url }}
    />
  );
}
