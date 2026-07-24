import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PrintStudio } from "@/components/dashboard/print/print-studio";

export default async function ProgramPrintPage({
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
  if (!user) notFound();

  const { data: program } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", programId)
    .eq("merchant_id", user.id)
    .single();
  if (!program) notFound();

  const { data: merchant } = await supabase.from("merchants").select("*").eq("id", user.id).single();
  const config = program.config as any;

  return (
    <div className="max-w-5xl">
      <Link
        href={`/${locale}/dashboard/programs/${programId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--muted)] hover:text-[var(--ink)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {program.name}
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-[var(--ink)]">Print & marketing materials</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Posters, table cards, stickers, and social assets for {program.name} — generated from your branding, in English or Arabic.
      </p>

      <div className="mt-8">
        <PrintStudio
          businessName={merchant?.business_name ?? "Your business"}
          logoUrl={merchant?.logo_url}
          programName={program.name}
          programId={program.id}
          primaryColor={config?.primary_color ?? merchant?.brand_color_primary ?? "#1f57e7"}
          secondaryColor={config?.secondary_color ?? merchant?.brand_color_secondary ?? "#faae62"}
        />
      </div>
    </div>
  );
}
