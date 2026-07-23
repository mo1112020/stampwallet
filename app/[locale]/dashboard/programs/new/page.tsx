import { setRequestLocale } from "next-intl/server";
import { ProgramForm } from "@/components/dashboard/program-form";
import { createClient } from "@/lib/supabase/server";

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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div>
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-[var(--ink)]">
        Create program
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
      />
    </div>
  );
}
