import { describe, expect, it } from "vitest";
import { mapDashboardData } from "./dashboard";

// Representative jsonb payload from public.dashboard_overview. The RPC already
// returns camelCase overview keys; mapDashboardData coerces number types and
// applies the delta -> activity type/label mapping (the bit kept out of SQL).
const rpcPayload = {
  programs: [
    { id: "p1", merchant_id: "m1", name: "Coffee", type: "stamp", is_active: true, config: { stamps_required: 10 }, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
    { id: "p2", merchant_id: "m1", name: "Points", type: "points", is_active: false, config: {}, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
  ],
  campaigns: [{ id: "c1", title: "Spring", status: "sent", updated_at: "2026-03-01T00:00:00Z" }],
  overview: {
    totalCustomers: 1000, activeCustomers: 226, totalCards: 1000, activeCards: 226,
    rewardsRedeemed: 19, totalScans: 385, pointsEarned: "954", pointsRedeemed: "10200",
    retentionRate: "47.8", repeatVisits: 159, revenueImpact: "112.5", currency: "USD",
  },
  previous_overview: {
    totalCustomers: 1000, activeCustomers: 0, totalCards: 1000, activeCards: 0,
    rewardsRedeemed: 0, totalScans: 0, pointsEarned: 0, pointsRedeemed: 0,
    retentionRate: 0, repeatVisits: 0, revenueImpact: null, currency: null,
  },
  activity: [
    { id: "s1", delta: { stamps_added: 1 }, created_at: "2026-04-10T10:00:00Z", customer_name: "Ada", program_name: "Coffee" },
    { id: "s2", delta: { points_added: 6 }, created_at: "2026-04-10T09:00:00Z", customer_name: null, program_name: "Points" },
    { id: "s3", delta: { points_spent: 100 }, created_at: "2026-04-10T08:00:00Z", customer_name: "Bo", program_name: "Points" },
    { id: "s4", delta: { stamps_reset: 1 }, created_at: "2026-04-10T07:00:00Z", customer_name: "Cy", program_name: "Coffee" },
    { id: "s5", delta: { stage_completed: 1 }, created_at: "2026-04-10T06:00:00Z", customer_name: "Di", program_name: "Steps" },
    { id: "s6", delta: {}, created_at: "2026-04-10T05:00:00Z", customer_name: "Ez", program_name: "Coffee" },
  ],
};

describe("mapDashboardData", () => {
  const d = mapDashboardData(rpcPayload);

  it("passes through full program rows and campaigns", () => {
    expect(d.programs).toHaveLength(2);
    expect(d.programs[0]).toMatchObject({ id: "p1", is_active: true, config: { stamps_required: 10 } });
    expect(d.campaigns).toEqual([{ id: "c1", title: "Spring", status: "sent", updated_at: "2026-03-01T00:00:00Z" }]);
  });

  it("coerces overview number fields (jsonb numerics can arrive as strings)", () => {
    expect(d.overview).toEqual({
      totalCustomers: 1000, activeCustomers: 226, totalCards: 1000, activeCards: 226,
      rewardsRedeemed: 19, totalScans: 385, pointsEarned: 954, pointsRedeemed: 10200,
      retentionRate: 47.8, repeatVisits: 159, revenueImpact: 112.5, currency: "USD",
    });
    for (const k of ["pointsEarned", "pointsRedeemed", "retentionRate", "revenueImpact"] as const) {
      expect(typeof d.overview[k]).toBe("number");
    }
  });

  it("keeps revenueImpact null when the RPC returns null (currency not configured)", () => {
    expect(d.previousOverview.revenueImpact).toBeNull();
    expect(d.previousOverview.currency).toBeNull();
  });

  it("maps redeem-shaped deltas to type 'redemption', others to 'scan'", () => {
    expect(d.activity.map((a) => a.type)).toEqual([
      "scan",       // stamps_added
      "scan",       // points_added
      "redemption", // points_spent
      "redemption", // stamps_reset
      "redemption", // stage_completed
      "scan",       // empty delta
    ]);
  });

  it("builds the detail label and carries customer/program names", () => {
    expect(d.activity[1]).toEqual({
      id: "s2", type: "scan", customerName: null, programName: "Points",
      detail: "points added: 6", createdAt: "2026-04-10T09:00:00Z",
    });
    expect(d.activity[5].detail).toBe("scan"); // empty delta -> "scan"
  });

  it("tolerates a null / empty payload", () => {
    const empty = mapDashboardData(null);
    expect(empty.programs).toEqual([]);
    expect(empty.campaigns).toEqual([]);
    expect(empty.activity).toEqual([]);
    expect(empty.overview.totalScans).toBe(0);
    expect(empty.overview.revenueImpact).toBeNull();
  });
});
