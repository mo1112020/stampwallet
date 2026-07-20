import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProgramForm } from "@/components/dashboard/program-form";
import { createClient } from "@/lib/supabase/server";
import type { ProgramConfig, ProgramType } from "@/types";

export default async function EditProgramPage({
  params,
}: {
  params: Promise<{ locale: string; programId: string }>;
}) {
  const { locale, programId } = await params;
  setRequestLocale(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", programId)
    .eq("merchant_id", user!.id)
    .single();

  if (!program) notFound();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user!.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const enrollUrl = `${appUrl}/${locale}/pass/new?program=${program.id}`;

  return (
    <div>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {program.name}
      </h1>
      <p className="mb-8 break-all text-sm text-[var(--muted)]">Enrollment: {enrollUrl}</p>
      <ProgramForm
        mode="edit"
        initial={{
          id: program.id,
          name: program.name,
          type: program.type as ProgramType,
          config: program.config as ProgramConfig,
          is_active: program.is_active,
        }}
        businessName={merchant?.business_name}
        primaryColor={merchant?.brand_color_primary}
        secondaryColor={merchant?.brand_color_secondary}
      />
    </div>
  );
}
