import type { createClient } from "@/lib/supabase/server";
import type { LoyaltyProgram, Merchant } from "@/types";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type DateRange = { from: string; to: string };

export function resolveDateRange(searchParams: {
  from?: string;
  to?: string;
}): DateRange {
  const to = searchParams.to && !Number.isNaN(Date.parse(searchParams.to)) ? searchParams.to : new Date().toISOString();
  const defaultFrom = new Date(to);
  defaultFrom.setDate(defaultFrom.getDate() - 30);
  const from =
    searchParams.from && !Number.isNaN(Date.parse(searchParams.from))
      ? searchParams.from
      : defaultFrom.toISOString();
  return { from, to };
}

export type AnalyticsFilters = DateRange & { programId?: string };

export type AnalyticsOverview = {
  totalCustomers: number;
  activeCustomers: number;
  totalCards: number;
  activeCards: number;
  rewardsRedeemed: number;
  totalScans: number;
  pointsEarned: number;
  pointsRedeemed: number;
  retentionRate: number;
  repeatVisits: number;
  /** null = business metrics not configured — hide the tile, never estimate. */
  revenueImpact: number | null;
  currency: string | null;
};

export type TrendPoint = { date: string; scans: number; redemptions: number };

export type ActivityEntry = {
  id: string;
  type: "scan" | "redemption";
  customerName: string | null;
  programName: string | null;
  detail: string;
  createdAt: string;
};

async function getMerchantPrograms(
  supabase: SupabaseClient,
  merchantId: string,
  programId?: string
): Promise<Pick<LoyaltyProgram, "id" | "name" | "type" | "config">[]> {
  let query = supabase
    .from("loyalty_programs")
    .select("id, name, type, config")
    .eq("merchant_id", merchantId);
  if (programId) query = query.eq("id", programId);
  const { data } = await query;
  return data ?? [];
}

export async function getAnalyticsOverview(
  supabase: SupabaseClient,
  merchant: Merchant,
  filters: AnalyticsFilters
): Promise<AnalyticsOverview> {
  const programs = await getMerchantPrograms(supabase, merchant.id, filters.programId);
  const programIds = programs.map((p) => p.id);
  const rewardValueByProgram = new Map(
    programs.map((p) => [p.id, (p.config as { reward_value?: number }).reward_value ?? null])
  );

  if (programIds.length === 0) {
    return {
      totalCustomers: 0,
      activeCustomers: 0,
      totalCards: 0,
      activeCards: 0,
      rewardsRedeemed: 0,
      totalScans: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      retentionRate: 0,
      repeatVisits: 0,
      revenueImpact: merchant.currency ? 0 : null,
      currency: merchant.currency,
    };
  }

  const { data: progressRows } = await supabase
    .from("customer_progress")
    .select("id, customer_id, program_id")
    .in("program_id", programIds);
  const progress = progressRows ?? [];
  const progressIds = progress.map((p) => p.id);
  const totalCards = progress.length;
  const totalCustomers = new Set(progress.map((p) => p.customer_id)).size;

  if (progressIds.length === 0) {
    return {
      totalCustomers,
      activeCustomers: 0,
      totalCards,
      activeCards: 0,
      rewardsRedeemed: 0,
      totalScans: 0,
      pointsEarned: 0,
      pointsRedeemed: 0,
      retentionRate: 0,
      repeatVisits: 0,
      revenueImpact: merchant.currency ? 0 : null,
      currency: merchant.currency,
    };
  }

  const { data: scanRows } = await supabase
    .from("scan_events")
    .select("id, customer_progress_id, delta, created_at")
    .in("customer_progress_id", progressIds)
    .gte("created_at", filters.from)
    .lte("created_at", filters.to);
  const scans = scanRows ?? [];

  const { data: redemptionRows } = await supabase
    .from("redemptions")
    .select("id, customer_progress_id, redeemed_at")
    .in("customer_progress_id", progressIds)
    .gte("redeemed_at", filters.from)
    .lte("redeemed_at", filters.to);
  const redemptions = redemptionRows ?? [];

  const scansByProgress = new Map<string, number>();
  let pointsEarned = 0;
  let pointsRedeemed = 0;
  for (const scan of scans) {
    scansByProgress.set(
      scan.customer_progress_id,
      (scansByProgress.get(scan.customer_progress_id) ?? 0) + 1
    );
    const delta = (scan.delta ?? {}) as Record<string, number>;
    pointsEarned += delta.points_added ?? 0;
    pointsRedeemed += delta.points_spent ?? 0;
  }

  const activeProgressIds = new Set(scansByProgress.keys());
  const activeCustomerIds = new Set(
    progress.filter((p) => activeProgressIds.has(p.id)).map((p) => p.customer_id)
  );

  const withAtLeastOneScan = [...scansByProgress.values()];
  const repeatCount = withAtLeastOneScan.filter((n) => n >= 2).length;
  const retentionRate =
    withAtLeastOneScan.length > 0 ? (repeatCount / withAtLeastOneScan.length) * 100 : 0;
  const repeatVisits = withAtLeastOneScan.reduce((sum, n) => sum + Math.max(0, n - 1), 0);

  const progressById = new Map(progress.map((p) => [p.id, p]));
  let revenueImpact: number | null = null;
  if (merchant.currency) {
    revenueImpact = 0;
    for (const r of redemptions) {
      const p = progressById.get(r.customer_progress_id);
      const value = p ? rewardValueByProgram.get(p.program_id) : null;
      revenueImpact += value ?? 0;
    }
  }

  return {
    totalCustomers,
    activeCustomers: activeCustomerIds.size,
    totalCards,
    activeCards: activeProgressIds.size,
    rewardsRedeemed: redemptions.length,
    totalScans: scans.length,
    pointsEarned,
    pointsRedeemed,
    retentionRate: Math.round(retentionRate * 10) / 10,
    repeatVisits,
    revenueImpact,
    currency: merchant.currency,
  };
}

export async function getScansTrend(
  supabase: SupabaseClient,
  merchant: Merchant,
  filters: AnalyticsFilters
): Promise<TrendPoint[]> {
  const programs = await getMerchantPrograms(supabase, merchant.id, filters.programId);
  const programIds = programs.map((p) => p.id);
  if (programIds.length === 0) return [];

  const { data: progressRows } = await supabase
    .from("customer_progress")
    .select("id")
    .in("program_id", programIds);
  const progressIds = (progressRows ?? []).map((p) => p.id);
  if (progressIds.length === 0) return [];

  const [{ data: scanRows }, { data: redemptionRows }] = await Promise.all([
    supabase
      .from("scan_events")
      .select("created_at")
      .in("customer_progress_id", progressIds)
      .gte("created_at", filters.from)
      .lte("created_at", filters.to),
    supabase
      .from("redemptions")
      .select("redeemed_at")
      .in("customer_progress_id", progressIds)
      .gte("redeemed_at", filters.from)
      .lte("redeemed_at", filters.to),
  ]);

  const buckets = new Map<string, TrendPoint>();
  const dayKey = (iso: string) => iso.slice(0, 10);

  for (const row of scanRows ?? []) {
    const key = dayKey(row.created_at as string);
    const bucket = buckets.get(key) ?? { date: key, scans: 0, redemptions: 0 };
    bucket.scans += 1;
    buckets.set(key, bucket);
  }
  for (const row of redemptionRows ?? []) {
    const key = dayKey(row.redeemed_at as string);
    const bucket = buckets.get(key) ?? { date: key, scans: 0, redemptions: 0 };
    bucket.redemptions += 1;
    buckets.set(key, bucket);
  }

  return [...buckets.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export async function getRecentActivity(
  supabase: SupabaseClient,
  merchant: Merchant,
  filters: { programId?: string; limit?: number }
): Promise<ActivityEntry[]> {
  const limit = filters.limit ?? 15;
  const programs = await getMerchantPrograms(supabase, merchant.id, filters.programId);
  const programIds = programs.map((p) => p.id);
  if (programIds.length === 0) return [];

  const { data: scanRows } = await supabase
    .from("scan_events")
    .select(
      "id, delta, resulted_in_reward, created_at, customer_progress!inner(program_id, customers(name), loyalty_programs(name))"
    )
    .in("customer_progress.program_id", programIds)
    .order("created_at", { ascending: false })
    .limit(limit);

  // Both award and redeem write a scan_events row (see app/api/scan/route.ts)
  // — redeem-shaped deltas (points_spent, stamps_reset, stage_completed)
  // are how a redemption shows up here, no separate redemptions query needed.
  const REDEEM_DELTA_KEYS = new Set(["points_spent", "stamps_reset", "stage_completed"]);

  const entries: ActivityEntry[] = (scanRows ?? []).map((row) => {
    const cp = row.customer_progress as unknown as {
      customers: { name: string | null } | null;
      loyalty_programs: { name: string } | null;
    };
    const delta = (row.delta ?? {}) as Record<string, number>;
    const [deltaKey, deltaValue] = Object.entries(delta)[0] ?? [];
    return {
      id: row.id as string,
      type: deltaKey && REDEEM_DELTA_KEYS.has(deltaKey) ? "redemption" : "scan",
      customerName: cp.customers?.name ?? null,
      programName: cp.loyalty_programs?.name ?? null,
      detail: deltaKey ? `${deltaKey.replace(/_/g, " ")}: ${deltaValue}` : "scan",
      createdAt: row.created_at as string,
    };
  });

  return entries.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
}
