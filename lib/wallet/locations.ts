import { createAdminClient } from "@/lib/supabase/admin";

export type WalletLocation = {
  latitude: number;
  longitude: number;
  relevantText?: string;
};

/**
 * Fetched inline by generateApplePass/generateGoogleWalletLink/
 * pushGooglePassUpdate (lib/wallet/apple.ts, google.ts) rather than
 * threaded through every caller — locations are merchant-level, not
 * per-pass, same reasoning as those functions already reading brand
 * colors straight off the `merchant` param. Best-effort: returns [] on any
 * failure so a locations lookup issue never blocks pass generation.
 *
 * A location with no rows in store_location_programs applies to every
 * program (the pre-"Apply to cards" behavior); one with rows only applies
 * when `programId` matches one of them.
 */
export async function getActiveStoreLocations(merchantId: string, programId?: string): Promise<WalletLocation[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("store_locations")
      .select("latitude, longitude, relevant_text, store_location_programs(program_id)")
      .eq("merchant_id", merchantId)
      .eq("is_active", true);

    return (data ?? [])
      .filter((row) => {
        const assigned = (row.store_location_programs ?? []) as { program_id: string }[];
        if (assigned.length === 0) return true;
        return programId ? assigned.some((a) => a.program_id === programId) : true;
      })
      .map((row) => ({
        latitude: row.latitude as number,
        longitude: row.longitude as number,
        relevantText: (row.relevant_text as string | null) ?? undefined,
      }));
  } catch {
    return [];
  }
}
