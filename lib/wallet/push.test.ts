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

import { pushWalletUpdate } from "./push";
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
