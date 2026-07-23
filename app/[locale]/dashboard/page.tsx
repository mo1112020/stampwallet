import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PhoneMockup, EmptyPhoneMockup } from "@/components/dashboard/phone-mockup";
import type { ProgramConfig, ProgramType } from "@/types";

export default async function DashboardHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${locale}/login`);

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user.id)
    .single();

  if (merchant && !merchant.onboarding_completed) {
    redirect(`/${locale}/dashboard/onboarding`);
  }

  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("merchant_id", user.id)
    .order("created_at", { ascending: false });


  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-10 animate-stagger-1">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">
          {t("welcome")}
          <span className="text-[var(--primary)]">
            {merchant?.business_name ? `, ${merchant.business_name}` : ""}
          </span>
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Plan: <span className="font-medium capitalize text-[var(--ink)]">{merchant?.plan ?? "free"}</span>
        </p>
      </header>

      {/* Section header */}
      <div className="flex items-center justify-between gap-4 animate-stagger-2 mb-8">
        <h2 className="text-xl font-semibold tracking-tight text-[var(--ink)]">Your Programs</h2>
        <Link
          href={`/${locale}/dashboard/templates`}
          className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 hover:shadow-md active:scale-95"
        >
          {t("createProgram")}
        </Link>
      </div>

      {/* Programs displayed as phone mockups */}
      <div className="animate-stagger-3 flex flex-wrap gap-8">
        {programs?.map((program) => {
          const config = program.config as any;
          const iconName = config?.icon && /^[A-Z]/.test(config.icon) ? config.icon : "Coffee";
          return (
            <PhoneMockup
              key={program.id}
              name={program.name}
              primaryColor={config?.primary_color ?? merchant?.brand_color_primary ?? "#3E0856"}
              secondaryColor={config?.secondary_color ?? merchant?.brand_color_secondary ?? "#FAAE62"}
              iconName={iconName}
              backgroundImage={config?.background_image_url}
              programType={program.type as ProgramType}
              programConfig={program.config as ProgramConfig}
              stampsRequired={config?.stamps_required ?? 10}
              stampsCollected={0}
              actionHref={`/${locale}/dashboard/programs/${program.id}`}
              actionText="Manage"
            />
          );
        })}

        {/* Always show "create" card at the end */}
        <EmptyPhoneMockup locale={locale} />
      </div>

      {!!programs?.length && (
        <section className="mt-12 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5 sm:p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-[var(--ink)]">Join pages</h2>
            <p className="mt-1 text-sm text-[var(--muted)]">Open, share, or customize the page customers use to join each program.</p>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {programs.map((program) => {
              const joinUrl = `/${locale}/pass/new?program=${program.id}`;
              return (
                <div key={program.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[var(--ink)]">{program.name}</p>
                    <p className={`mt-1 text-sm ${program.is_active ? "text-[var(--success)]" : "text-[var(--muted)]"}`}>{program.is_active ? "Live and ready to share" : "Paused — join page is unavailable"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link href={`/${locale}/dashboard/programs/${program.id}#join-page`} className="inline-flex h-9 items-center justify-center rounded-full border border-[var(--line)] px-4 text-sm font-semibold text-[var(--ink)] hover:bg-[var(--surface-2)]">Edit join page</Link>
                    {program.is_active && <a href={joinUrl} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center justify-center rounded-full bg-[var(--primary)] px-4 text-sm font-semibold text-white hover:opacity-95">Open page</a>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Empty state when no programs */}
      {!programs?.length && (
        <div className="mt-4 flex flex-col items-center justify-center rounded-3xl bg-[var(--surface)] p-12 text-center shadow-sm ring-1 ring-black/5 dark:ring-white/10">
          <h3 className="text-lg font-semibold text-[var(--ink)]">No programs yet</h3>
          <p className="mt-2 max-w-sm text-sm text-[var(--muted)]">
            {t("emptyPrograms")}
          </p>
          <Link
            href={`/${locale}/dashboard/templates`}
            className="mt-6 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white transition-transform active:scale-95"
          >
            Browse Templates
          </Link>
        </div>
      )}
    </div>
  );
}
