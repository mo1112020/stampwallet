import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getSessionOrNull } from "@/lib/api";
import { roleHasCapability } from "@/lib/auth/permissions";
import { SettingsNav } from "@/components/dashboard/settings/settings-nav";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  const t = await getTranslations("settings");

  if (!roleHasCapability(session.role, "manage_settings")) {
    return (
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--primary)]">
          {t("title")}
        </h1>
        <p className="mt-4 text-sm text-[var(--muted)]">{t("noAccess")}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--primary)]">
        {t("title")}
      </h1>
      <div className="mt-6">
        <SettingsNav locale={locale} />
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}
