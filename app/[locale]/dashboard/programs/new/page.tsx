import { setRequestLocale } from "next-intl/server";
import { ProgramForm } from "@/components/dashboard/program-form";
import { createClient } from "@/lib/supabase/server";

export default async function NewProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
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
      <h1 className="mb-8 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        Create program
      </h1>
      <ProgramForm
        mode="create"
        businessName={merchant?.business_name}
        primaryColor={merchant?.brand_color_primary}
        secondaryColor={merchant?.brand_color_secondary}
      />
    </div>
  );
}
