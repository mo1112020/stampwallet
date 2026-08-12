import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { ExternalLink } from "lucide-react";
import { ProgramForm } from "@/components/dashboard/program-form";
import { getSessionOrNull } from "@/lib/api";
import { roleHasCapability } from "@/lib/auth/permissions";
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
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);
  if (!roleHasCapability(session.role, "manage_programs")) redirect(`/${locale}/dashboard/programs`);

  const { data: program, error: programError } = await session.supabase
    .from("loyalty_programs")
    .select("*")
    .eq("id", programId)
    .eq("merchant_id", session.merchantId)
    .single();

  if (programError && programError.code !== "PGRST116") {
    // If it's a network error or something other than "no rows returned", throw it
    throw programError;
  }

  if (!program) notFound();

  const merchant = session.merchant;
  const enrollUrl = `/${locale}/pass/new?program=${program.id}`;

  return (
    <div>
      {/* Same heading treatment as every other dashboard page (Programs,
          Customers, the program-creation page) — this one was the odd
          outlier in display-font 4xl primary-blue, which read as an
          unstyled link rather than a page title. */}
      <h1 className="mb-6 text-3xl font-bold tracking-tight text-[var(--ink)]">
        {program.name}
      </h1>
      <section className="mb-8 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
              <span className="inline-block h-2 w-2 shrink-0 rounded-full bg-[var(--success)]" />
              Your join page is live
            </p>
            <p className="mt-1.5 truncate font-mono text-xs text-[var(--muted)]">{enrollUrl}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Link
              href={`/${locale}/dashboard/programs/${program.id}/print`}
              className="inline-flex h-10 items-center justify-center rounded-full border border-[var(--line)] px-5 text-sm font-semibold text-[var(--ink)] transition-colors hover:bg-[var(--surface-2)]"
            >
              Print &amp; marketing
            </Link>
            <a
              href={enrollUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-full bg-[var(--primary)] px-5 text-sm font-semibold text-white transition-opacity hover:opacity-95"
            >
              Open join page
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
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
        merchantPlan={merchant?.plan}
      />
    </div>
  );
}
