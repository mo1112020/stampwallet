import { getTranslations } from "next-intl/server";

/**
 * No public API or webhook-out system exists yet, and none is in scope on
 * the current roadmap — building a functioning API-key system with nothing
 * to authenticate against would be a feature with no purpose. Shell only,
 * until a real use case defines what a key should grant.
 */
export default async function IntegrationsSettingsPage() {
  const t = await getTranslations("settings.integrations");

  return (
    <div className="max-w-md rounded-2xl border border-dashed border-[var(--line)] p-8 text-center">
      <p className="text-sm font-semibold text-[var(--ink)]">{t("title")}</p>
      <p className="mt-2 text-sm text-[var(--muted)]">{t("description")}</p>
    </div>
  );
}
