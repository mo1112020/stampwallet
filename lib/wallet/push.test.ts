import { beforeEach, describe, expect, it, vi } from "vitest";

const { isWithinFreePlanNotificationCap } = vi.hoisted(() => ({
  isWithinFreePlanNotificationCap: vi.fn(),
}));
vi.mock("@/lib/billing/notificationCap", () => ({ isWithinFreePlanNotificationCap }));

const { pushApplePassUpdate } = vi.hoisted(() => ({ pushApplePassUpdate: vi.fn() }));
vi.mock("@/lib/wallet/apple", () => ({ pushApplePassUpdate }));

const { pushGooglePassUpdate } = vi.hoisted(() => ({ pushGooglePassUpdate: vi.fn() }));
vi.mock("@/lib/wallet/google", () => ({ pushGooglePassUpdate }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [], error: null }) }) }),
  })),
}));

const { resolveSegmentTargets } = vi.hoisted(() => ({ resolveSegmentTargets: vi.fn() }));
vi.mock("@/lib/notifications/segments", () => ({ resolveSegmentTargets }));

import { pushWalletUpdate, pushProgramUpdateToAllCustomers } from "./push";
import type { LoyaltyProgram, Merchant } from "@/types";

const program = { id: "program-1" } as LoyaltyProgram;

function merchant(overrides: Partial<Merchant> = {}): Merchant {
  return { plan: "pro", billing_enforced_at: null, ...overrides } as Merchant;
}

beforeEach(() => {
  vi.clearAllMocks();
  pushApplePassUpdate.mockResolvedValue({ ok: true, stub: false });
  pushGooglePassUpdate.mockResolvedValue({ ok: true, stub: false });
});

describe("pushWalletUpdate — free-plan notification cap gating (post-billing-enforcement)", () => {
  it("never checks the cap for a paying plan", async () => {
    await pushWalletUpdate({
      passId: "pass-1",
      googleObjectId: null,
      program,
      merchant: merchant({ plan: "pro" }),
      progress: { stamps_collected: 1 },
    });
    expect(isWithinFreePlanNotificationCap).not.toHaveBeenCalled();
    expect(pushApplePassUpdate).toHaveBeenCalled();
  });

  it("does NOT cap a free-plan merchant still mid-grace-period (billing_enforced_at not yet set)", async () => {
    await pushWalletUpdate({
      passId: "pass-1",
      googleObjectId: null,
      program,
      merchant: merchant({ plan: "free", billing_enforced_at: null }),
      progress: { stamps_collected: 1 },
    });
    // The grace-period promise ("nothing changes yet") must hold even
    // though plan is already "free" at this point.
    expect(isWithinFreePlanNotificationCap).not.toHaveBeenCalled();
    expect(pushApplePassUpdate).toHaveBeenCalled();
  });

  it("skips the push entirely once enforced and the customer is beyond the cap", async () => {
    isWithinFreePlanNotificationCap.mockResolvedValue(false);
    const result = await pushWalletUpdate({
      passId: "pass-101",
      googleObjectId: "obj-1",
      program,
      merchant: merchant({ plan: "free", billing_enforced_at: "2026-08-15T00:00:00Z" }),
      progress: { stamps_collected: 1 },
    });
    expect(result).toEqual({
      apple: { applicable: false, ok: true },
      google: { applicable: false, ok: true },
    });
    expect(pushApplePassUpdate).not.toHaveBeenCalled();
    expect(pushGooglePassUpdate).not.toHaveBeenCalled();
  });

  it("still pushes normally once enforced if the customer is within the cap", async () => {
    isWithinFreePlanNotificationCap.mockResolvedValue(true);
    await pushWalletUpdate({
      passId: "pass-1",
      googleObjectId: null,
      program,
      merchant: merchant({ plan: "free", billing_enforced_at: "2026-08-15T00:00:00Z" }),
      progress: { stamps_collected: 1 },
    });
    expect(pushApplePassUpdate).toHaveBeenCalled();
  });
});

describe("pushProgramUpdateToAllCustomers — batched fan-out (P1: notification fan-out)", () => {
  function target(id: string) {
    return {
      customerProgressId: id,
      passId: `pass-${id}`,
      googleObjectId: null,
      program,
      merchant: merchant(),
      progress: { stamps_collected: 1 },
      enrolledAt: "2026-01-01T00:00:00Z",
    };
  }

  it("pushes every target and reports zero failures on the happy path", async () => {
    const targets = Array.from({ length: 25 }, (_, i) => target(`cp-${i}`));
    resolveSegmentTargets.mockResolvedValue(targets);

    const result = await pushProgramUpdateToAllCustomers("merchant-1", "program-1");

    expect(pushApplePassUpdate).toHaveBeenCalledTimes(25);
    expect(result.succeeded).toBe(25);
    expect(result.failed).toBe(0);
  });

  it("keeps pushing the rest of the list when one target's push fails", async () => {
    const targets = Array.from({ length: 5 }, (_, i) => target(`cp-${i}`));
    resolveSegmentTargets.mockResolvedValue(targets);
    pushApplePassUpdate.mockImplementation(async () => {
      throw new Error("APNs down");
    });

    const result = await pushProgramUpdateToAllCustomers("merchant-1", "program-1");

    // Every target was still attempted (batching isolates failures — one
    // bad push doesn't stop its batch-mates or abort the broadcast), the
    // failure just gets counted instead of silently vanishing.
    expect(pushApplePassUpdate).toHaveBeenCalledTimes(5);
    expect(result.failed).toBe(5);
  });
});
