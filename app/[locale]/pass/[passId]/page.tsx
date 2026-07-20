import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { WalletPreview } from "@/components/wallet-preview/wallet-preview";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ProgramConfig, ProgramType, Progress } from "@/types";

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

  const { data: row } = await admin
    .from("customer_progress")
    .select("*, loyalty_programs(*, merchants(*))")
    .eq("pass_id", passId)
    .maybeSingle();

  if (!row) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
        <p className="text-[var(--muted)]">{t("notFound")}</p>
      </main>
    );
  }

  const program = row.loyalty_programs as unknown as {
    name: string;
    type: ProgramType;
    config: ProgramConfig;
    merchants: {
      business_name: string;
      brand_color_primary: string;
      brand_color_secondary: string;
    };
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
      <h1 className="mb-6 text-center font-[family-name:var(--font-display)] text-3xl text-[var(--brand)]">
        {t("progress")}
      </h1>
      <WalletPreview
        type={program.type}
        config={program.config}
        progress={row.progress as Progress}
        businessName={program.merchants.business_name}
        primaryColor={program.merchants.brand_color_primary}
        secondaryColor={program.merchants.brand_color_secondary}
      />
      <p className="mt-6 text-center text-sm text-[var(--muted)]">{program.name}</p>
    </main>
  );
}
