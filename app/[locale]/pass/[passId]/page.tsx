import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WalletPreview } from "@/components/wallet-preview/wallet-preview";
import { ProgressSummary } from "@/components/pass/progress-summary";
import { WalletActions } from "@/components/pass/wallet-actions";
import { createAdminClient } from "@/lib/supabase/admin";
import { detectWalletPlatform } from "@/lib/wallet/platform";
import type { ProgramConfig, ProgramType, Progress } from "@/types";

// A public, merchant-branded surface (not the app's own dashboard) — pinned
// to its light-mode values so it reads consistently regardless of the
// visitor's device theme, same reasoning as app/[locale]/pass/new/page.tsx.
const LIGHT_PAGE_VARS = {
  "--ink": "#1c1c1c",
  "--muted": "#6b7280",
  "--line": "#e5e7eb",
  "--line-strong": "#d1d5db",
  "--surface": "#ffffff",
  "--surface-2": "#f3f4f6",
  "--surface-3": "#e5e7eb",
  "--success": "#16a34a",
  "--success-soft": "#eafaf0",
  "--danger": "#dc2626",
} as React.CSSProperties;

export default async function PassPage({
  params,
}: {
  params: Promise<{ locale: string; passId: string }>;
}) {
  const { locale, passId } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("pass");

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    notFound();
  }

  const [{ data: row }, headerList] = await Promise.all([
    admin
      .from("customer_progress")
      .select("*, loyalty_programs(*, merchants(*))")
      .eq("pass_id", passId)
      .maybeSingle(),
    headers(),
  ]);

  const platform = detectWalletPlatform(headerList.get("user-agent") ?? "");

  if (!row) {
    return (
      <main
        className="flex min-h-screen items-center justify-center px-6 text-center"
        style={{ ...LIGHT_PAGE_VARS, backgroundColor: "#f6f6f6" }}
      >
        <div>
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-2)] text-2xl">
            🔍
          </div>
          <h1 className="mt-5 text-xl font-bold text-[var(--ink)]">{t("notFoundTitle")}</h1>
          <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">{t("notFoundDescription")}</p>
        </div>
      </main>
    );
  }

  const program = row.loyalty_programs as unknown as {
    name: string;
    type: ProgramType;
    config: ProgramConfig;
    merchants: {
      business_name: string;
      logo_url: string | null;
      brand_color_primary: string;
      brand_color_secondary: string;
    };
  };
  const merchant = program.merchants;
  const progress = row.progress as Progress;
  const color = (program.config as { primary_color?: string }).primary_color ?? merchant.brand_color_primary;
  const secondaryColor =
    (program.config as { secondary_color?: string }).secondary_color ?? merchant.brand_color_secondary;

  return (
    <main
      className="min-h-screen px-4 py-10 sm:py-14"
      style={{ ...LIGHT_PAGE_VARS, backgroundColor: "#f6f6f6" }}
    >
      <div className="mx-auto flex w-full max-w-sm flex-col items-center">
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[var(--surface)] shadow-sm ring-1 ring-black/5">
          {merchant.logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={merchant.logo_url} alt={merchant.business_name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xl font-bold" style={{ color }}>
              {merchant.business_name?.slice(0, 1)?.toUpperCase() || "?"}
            </span>
          )}
        </div>
        <p className="mt-3 text-[15px] font-semibold text-[var(--ink)]">{merchant.business_name}</p>
        <p className="text-[13px] text-[var(--muted)]">{program.name}</p>

        <div className="mt-6 w-full">
          <WalletPreview
            type={program.type}
            config={program.config}
            progress={progress}
            businessName={merchant.business_name}
            primaryColor={color}
            secondaryColor={secondaryColor}
            enrolledAt={row.created_at}
          />
        </div>

        <div className="mt-5 w-full">
          <ProgressSummary type={program.type} config={program.config} progress={progress} color={color} t={t} />
        </div>

        <div className="mt-5 w-full">
          <WalletActions
            passId={passId}
            appleAuthToken={row.apple_auth_token}
            googleAuthToken={row.google_auth_token}
            platform={platform}
            labels={{
              apple: t("addToAppleWallet"),
              google: t("addToGoogleWallet"),
              adding: t("adding"),
              error: t("walletError"),
            }}
          />
        </div>

        <p className="mt-8 text-[12px] text-[var(--muted)]">{t("poweredBy")}</p>
      </div>
    </main>
  );
}
