import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProgramForm } from "@/components/dashboard/program-form";
import { getSessionOrNull } from "@/lib/api";
import { roleHasCapability } from "@/lib/auth/permissions";

export default async function NewProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale } = await params;
  const { name, primaryColor, secondaryColor, iconName, backgroundImage } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("programs");

  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);
  if (!roleHasCapability(session.role, "manage_programs")) redirect(`/${locale}/dashboard/programs`);

  const merchant = session.merchant;

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-[var(--ink)]">
        {t("createTitle")}
      </h1>
      <ProgramForm
        mode="create"
        initialName={typeof name === "string" ? name : undefined}
        businessName={merchant?.business_name}
        businessLogo={merchant?.logo_url}
        primaryColor={typeof primaryColor === "string" ? primaryColor : merchant?.brand_color_primary}
        secondaryColor={typeof secondaryColor === "string" ? secondaryColor : merchant?.brand_color_secondary}
        initialIconName={typeof iconName === "string" ? iconName : "Coffee"}
        initialBackgroundImage={typeof backgroundImage === "string" ? backgroundImage : undefined}
        merchantPlan={merchant?.plan}
      />
    </div>
  );
}
