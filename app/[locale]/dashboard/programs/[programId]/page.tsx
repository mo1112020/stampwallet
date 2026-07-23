import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ProgramForm } from "@/components/dashboard/program-form";
import { createClient } from "@/lib/supabase/server";
import type { ProgramConfig, ProgramType } from "@/types";
import NewProgramPage from "../new/page";

export default async function EditProgramPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; programId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { locale, programId } = await params;
  
  if (programId === "new") {
    return <NewProgramPage params={params} searchParams={searchParams} />;
  }

  setRequestLocale(locale);
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: program, error: programError } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", programId)
    .eq("merchant_id", user!.id)
    .single();

  if (programError && programError.code !== "PGRST116") {
    // If it's a network error or something other than "no rows returned", throw it
    throw programError;
  }

  if (!program) notFound();

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user!.id)
    .single();

  const enrollUrl = `/${locale}/pass/new?program=${program.id}`;

  return (
    <div>
      <h1 className="mb-2 font-[family-name:var(--font-display)] text-4xl text-[var(--primary)]">
        {program.name}
      </h1>
      <section className="mb-8 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:flex sm:items-center sm:justify-between sm:gap-5">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[var(--ink)]">Your join page is live</p>
          <p className="mt-1 truncate text-sm text-[var(--muted)]">{enrollUrl}</p>
        </div>
        <a
          href={enrollUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white hover:opacity-95 sm:mt-0"
        >
          Open join page
        </a>
      </section>
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
        businessLogo={merchant?.logo_url}
        primaryColor={merchant?.brand_color_primary}
        secondaryColor={merchant?.brand_color_secondary}
      />
    </div>
  );
}
