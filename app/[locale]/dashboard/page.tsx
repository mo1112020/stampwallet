import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

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
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        {t("welcome")}
        {merchant?.business_name ? `, ${merchant.business_name}` : ""}
      </h1>
      <p className="mt-2 text-[var(--muted)]">Plan: {merchant?.plan ?? "free"}</p>

      <div className="mt-8 flex items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">{t("createProgram").replace("Create ", "")}</h2>
        <Link
          href={`/${locale}/dashboard/programs/new`}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
        >
          {t("createProgram")}
        </Link>
      </div>

      {!programs?.length ? (
        <p className="mt-10 rounded-2xl border border-dashed border-[var(--line)] bg-[var(--surface)] p-10 text-[var(--muted)]">
          {t("emptyPrograms")}
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {programs.map((program) => (
            <li key={program.id} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-lg font-semibold text-[var(--ink)]">{program.name}</p>
                  <p className="text-sm capitalize text-[var(--muted)]">{program.type}</p>
                </div>
                <span className="text-xs font-medium uppercase tracking-wide text-[var(--brand)]">
                  {program.is_active ? t("active") : t("inactive")}
                </span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/${locale}/dashboard/programs/${program.id}`}
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
                >
                  Edit
                </Link>
                <Link
                  href={`/${locale}/dashboard/programs/${program.id}/scan`}
                  className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-sm text-white"
                >
                  {t("scan")}
                </Link>
                <Link
                  href={`/${locale}/dashboard/programs/${program.id}/customers`}
                  className="rounded-lg border border-[var(--line)] px-3 py-1.5 text-sm"
                >
                  {t("customers")}
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
