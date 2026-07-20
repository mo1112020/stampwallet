import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export default async function AnalyticsPage({
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

  const { count: programCount } = await supabase
    .from("loyalty_programs")
    .select("*", { count: "exact", head: true })
    .eq("merchant_id", user!.id)
    .eq("is_active", true);

  const { data: programs } = await supabase
    .from("loyalty_programs")
    .select("id")
    .eq("merchant_id", user!.id);

  const programIds = (programs ?? []).map((p) => p.id);

  let enrolled = 0;
  let redemptions = 0;
  let redemptionsWeek = 0;

  if (programIds.length) {
    const { count } = await supabase
      .from("customer_progress")
      .select("*", { count: "exact", head: true })
      .in("program_id", programIds);
    enrolled = count ?? 0;

    const { data: progressRows } = await supabase
      .from("customer_progress")
      .select("id")
      .in("program_id", programIds);
    const progressIds = (progressRows ?? []).map((r) => r.id);

    if (progressIds.length) {
      const { count: rCount } = await supabase
        .from("redemptions")
        .select("*", { count: "exact", head: true })
        .in("customer_progress_id", progressIds);
      redemptions = rCount ?? 0;

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const { count: wCount } = await supabase
        .from("redemptions")
        .select("*", { count: "exact", head: true })
        .in("customer_progress_id", progressIds)
        .gte("redeemed_at", weekAgo.toISOString());
      redemptionsWeek = wCount ?? 0;
    }
  }

  const cards = [
    { label: "Active programs", value: programCount ?? 0 },
    { label: "Enrolled customers", value: enrolled },
    { label: "Total redemptions", value: redemptions },
    { label: "Redemptions this week", value: redemptionsWeek },
  ];

  return (
    <div>
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        Analytics
      </h1>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
            <p className="text-sm text-[var(--muted)]">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--ink)]">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
