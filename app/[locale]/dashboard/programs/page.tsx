import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

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

  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("merchant_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
          Programs
        </h1>
        <Link
          href={`/${locale}/dashboard/programs/new`}
          className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white"
        >
          {t("createProgram")}
        </Link>
      </div>
      <ul className="mt-8 space-y-3">
        {(programs ?? []).map((p) => (
          <li key={p.id}>
            <Link
              href={`/${locale}/dashboard/programs/${p.id}`}
              className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 hover:border-[var(--brand)]"
            >
              <span className="font-medium">{p.name}</span>
              <span className="text-sm capitalize text-[var(--muted)]">{p.type}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
