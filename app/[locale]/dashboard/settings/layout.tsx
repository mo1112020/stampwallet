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
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
        <p className="mt-4 text-sm text-[var(--muted)]">{t("noAccess")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">{t("title")}</h1>
      <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:items-start">
        <SettingsNav locale={locale} />
        <div className="min-w-0 flex-1 lg:border-s lg:border-[var(--line)] lg:ps-10">{children}</div>
      </div>
    </div>
  );
}
