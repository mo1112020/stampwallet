import { setRequestLocale } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage({
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
    <div className="max-w-lg">
      <h1 className="font-[family-name:var(--font-display)] text-4xl text-[var(--brand)]">
        Settings
      </h1>
      <dl className="mt-8 space-y-4 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 text-sm">
        <div>
          <dt className="text-[var(--muted)]">Business</dt>
          <dd className="font-medium">{merchant?.business_name}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Industry</dt>
          <dd className="font-medium">{merchant?.industry || "—"}</dd>
        </div>
        <div>
          <dt className="text-[var(--muted)]">Plan</dt>
          <dd className="font-medium capitalize">{merchant?.plan}</dd>
        </div>
        <div className="flex gap-3">
          <div
            className="h-10 w-10 rounded-lg border border-[var(--line)]"
            style={{ background: merchant?.brand_color_primary }}
          />
          <div
            className="h-10 w-10 rounded-lg border border-[var(--line)]"
            style={{ background: merchant?.brand_color_secondary }}
          />
        </div>
      </dl>
    </div>
  );
}
