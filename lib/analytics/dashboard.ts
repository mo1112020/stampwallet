import type { createClient } from "@/lib/supabase/server";
import type { LoyaltyProgram, Merchant } from "@/types";
import type { ActivityEntry, AnalyticsOverview, DateRange } from "./queries";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type DashboardCampaign = {
  id: string;
  title: string;
  status: string;
  updated_at: string;
};

export type DashboardData = {
  programs: LoyaltyProgram[];
  campaigns: DashboardCampaign[];
  overview: AnalyticsOverview;
  previousOverview: AnalyticsOverview;
  activity: ActivityEntry[];
};

/** Rows as the dashboard_overview RPC returns them in `activity` (raw scan_events
 * slice). The delta -> type/label mapping stays here (was getRecentActivity). */
type RawActivityRow = {
  id: string;
  delta: Record<string, number> | null;
  created_at: string;
  customer_name: string | null;
  program_name: string | null;
};

// Redeem-shaped deltas — a redemption shows up as a scan_events row with one
// of these keys. Kept identical to the previous getRecentActivity().
const REDEEM_DELTA_KEYS = new Set(["points_spent", "stamps_reset", "stage_completed"]);

function mapActivityRow(row: RawActivityRow): ActivityEntry {
  const delta = (row.delta ?? {}) as Record<string, number>;
  const [deltaKey, deltaValue] = Object.entries(delta)[0] ?? [];
  return {
    id: row.id,
    type: deltaKey && REDEEM_DELTA_KEYS.has(deltaKey) ? "redemption" : "scan",
    customerName: row.customer_name ?? null,
    programName: row.program_name ?? null,
    detail: deltaKey ? `${deltaKey.replace(/_/g, " ")}: ${deltaValue}` : "scan",
    createdAt: row.created_at,
  };
}

function num(x: unknown): number {
  return typeof x === "number" ? x : Number(x ?? 0);
}

function normalizeOverview(o: Record<string, unknown> | null | undefined): AnalyticsOverview {
  const v = o ?? {};
  return {
    totalCustomers: num(v.totalCustomers),
    activeCustomers: num(v.activeCustomers),
    totalCards: num(v.totalCards),
    activeCards: num(v.activeCards),
    rewardsRedeemed: num(v.rewardsRedeemed),
    totalScans: num(v.totalScans),
    pointsEarned: num(v.pointsEarned),
    pointsRedeemed: num(v.pointsRedeemed),
    retentionRate: num(v.retentionRate),
    repeatVisits: num(v.repeatVisits),
    revenueImpact: v.revenueImpact == null ? null : Number(v.revenueImpact),
    currency: (v.currency as string | null) ?? null,
  };
}

/** Shapes the raw jsonb from the dashboard_overview RPC into what the page uses.
 * Exported so it can be unit-tested without a database. */
export function mapDashboardData(raw: unknown): DashboardData {
  const j = (raw ?? {}) as Record<string, unknown>;
  return {
    programs: (j.programs as LoyaltyProgram[]) ?? [],
    campaigns: (j.campaigns as DashboardCampaign[]) ?? [],
    overview: normalizeOverview(j.overview as Record<string, unknown>),
    previousOverview: normalizeOverview(j.previous_overview as Record<string, unknown>),
    activity: ((j.activity as RawActivityRow[]) ?? []).map(mapActivityRow),
  };
}

/**
 * Dashboard-home data in ONE Supabase round trip. Replaces the previous
 * ~8 separate calls (loyalty_programs, notification_campaigns,
 * customer_progress, scan_events x3, redemptions x2) with the
 * public.dashboard_overview RPC (supabase/migrations/025_dashboard_overview.sql),
 * which does the same aggregation DB-side. Output is verified 1:1 against the
 * old getAnalyticsOverview / getRecentActivity path — see docs/load-testing-report.md §9.5.
 *
 * Authorization/tenant isolation is unchanged: the RPC's gate is the exact
 * predicate the RLS policies on those tables use
 * (p_merchant_id = auth.uid() OR is_active_staff_of(p_merchant_id)).
 */
export async function getDashboardData(
  supabase: SupabaseClient,
  merchant: Merchant,
  currentRange: DateRange,
  previousRange: DateRange,
  activityLimit = 6
): Promise<DashboardData> {
  const { data, error } = await supabase.rpc("dashboard_overview", {
    p_merchant_id: merchant.id,
    p_from: currentRange.from,
    p_to: currentRange.to,
    p_prev_from: previousRange.from,
    p_prev_to: previousRange.to,
    p_activity_limit: activityLimit,
  });
  if (error) {
    throw new Error(`dashboard_overview RPC failed: ${error.message}`);
  }
  return mapDashboardData(data);
}
