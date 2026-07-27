import { redirect } from "next/navigation";
import { getSessionOrNull } from "@/lib/api";
import { LocationsContent } from "@/components/dashboard/settings/locations-content";
import type { StoreLocation } from "@/types";

export default async function LocationsSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const session = await getSessionOrNull();
  if (!session) redirect(`/${locale}/login`);

  const [{ data: locationRows }, { data: programs }] = await Promise.all([
    session.supabase
      .from("store_locations")
      .select("*, store_location_programs(program_id)")
      .eq("merchant_id", session.merchantId)
      .order("created_at", { ascending: false }),
    session.supabase.from("loyalty_programs").select("id, name").eq("merchant_id", session.merchantId),
  ]);

  const locations: StoreLocation[] = (locationRows ?? []).map((row) => {
    const { store_location_programs, ...location } = row as Record<string, unknown> & {
      store_location_programs: { program_id: string }[];
    };
    return { ...location, program_ids: store_location_programs.map((p) => p.program_id) } as StoreLocation;
  });

  return (
    <LocationsContent
      locations={locations}
      programs={programs ?? []}
      merchant={{
        business_name: session.merchant.business_name,
        logo_url: session.merchant.logo_url,
        plan: session.merchant.plan,
      }}
    />
  );
}
