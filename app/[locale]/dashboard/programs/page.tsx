import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { PhoneMockup, EmptyPhoneMockup } from "@/components/dashboard/phone-mockup";
import type { ProgramConfig, ProgramType } from "@/types";

export default async function ProgramsPage({
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

  const { data: merchant } = await supabase
    .from("merchants")
    .select("*")
    .eq("id", user!.id)
    .single();

  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("merchant_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-6xl">
      {/* Header */}
      <div className="mb-10 flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight text-[var(--ink)]">Programs</h1>
        <Link
          href={`/${locale}/dashboard/templates`}
          className="rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:opacity-90 active:scale-95"
        >
          {t("createProgram")}
        </Link>
      </div>

      {/* Programs as phone mockups */}
      <div className="flex flex-wrap gap-8">
        {(programs ?? []).map((p) => {
          const config = p.config as any;
          const iconName =
            config?.icon && /^[A-Z]/.test(config.icon) ? config.icon : "Coffee";
          return (
            <PhoneMockup
              key={p.id}
              name={p.name}
              primaryColor={config?.primary_color ?? merchant?.brand_color_primary ?? "#3E0856"}
              secondaryColor={config?.secondary_color ?? merchant?.brand_color_secondary ?? "#FAAE62"}
              iconName={iconName}
              backgroundImage={config?.background_image_url}
              programType={p.type as ProgramType}
              programConfig={p.config as ProgramConfig}
              stampsRequired={config?.stamps_required ?? 10}
              stampsCollected={0}
              isActive={p.is_active}
              actionHref={`/${locale}/dashboard/programs/${p.id}`}
              actionText="Manage"
            />
          );
        })}

        {/* Create new */}
        <EmptyPhoneMockup locale={locale} />
      </div>

      {/* Empty state */}
      {!(programs ?? []).length && (
        <div className="mt-16 flex flex-col items-center text-center">
          <p className="text-[var(--muted)]">No programs yet. Start by browsing templates.</p>
          <Link
            href={`/${locale}/dashboard/templates`}
            className="mt-4 rounded-xl bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Browse Templates
          </Link>
        </div>
      )}
    </div>
  );
}
