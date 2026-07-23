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
 */
export async function getActiveStoreLocations(merchantId: string): Promise<WalletLocation[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("store_locations")
      .select("latitude, longitude, relevant_text")
      .eq("merchant_id", merchantId)
      .eq("is_active", true);

    return (data ?? []).map((row) => ({
      latitude: row.latitude as number,
      longitude: row.longitude as number,
      relevantText: (row.relevant_text as string | null) ?? undefined,
    }));
  } catch {
    return [];
  }
}
