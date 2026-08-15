import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireCapability } = vi.hoisted(() => ({ requireCapability: vi.fn() }));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, requireCapability };
});

const { checkRateLimit } = vi.hoisted(() => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));

const { pushWalletUpdate } = vi.hoisted(() => ({ pushWalletUpdate: vi.fn() }));
vi.mock("@/lib/wallet/push", () => ({ pushWalletUpdate }));

const { triggerAutomatedNotification } = vi.hoisted(() => ({
  triggerAutomatedNotification: vi.fn(),
}));
vi.mock("@/lib/notifications/campaigns", () => ({ triggerAutomatedNotification }));

import { POST } from "./route";

const PASS_ID = "11111111-1111-4111-8111-111111111111";
const MERCHANT_ID = "merchant-1";

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/scan", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Fluent fake matching `.from("customer_progress").select(...).eq(...).single()` + `.rpc(...)`. */
function makeSupabase({
  selectResult,
  rpcResult,
}: {
  selectResult: { data: unknown; error: unknown };
  rpcResult: { data: unknown; error: unknown };
}) {
  const single = vi.fn().mockResolvedValue(selectResult);
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  const rpc = vi.fn().mockResolvedValue(rpcResult);
  return { from, rpc };
}

function programRow(overrides: Partial<{ merchant_id: string; is_active: boolean }> = {}) {
  return {
    id: "row-1",
    pass_id: PASS_ID,
    google_object_id: null,
    created_at: "2026-01-01T00:00:00Z",
    loyalty_programs: {
      id: "program-1",
      name: "Coffee Club",
      type: "stamp",
      merchant_id: overrides.merchant_id ?? MERCHANT_ID,
      is_active: overrides.is_active ?? true,
      config: { stamps_required: 5, reward_description: "Free coffee" },
      merchants: { id: MERCHANT_ID, notification_prefs: { reward_unlocked: false } },
    },
    customers: { name: "Jane", phone: null, email: null },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  checkRateLimit.mockResolvedValue(true);
  pushWalletUpdate.mockResolvedValue(undefined);
  triggerAutomatedNotification.mockResolvedValue(undefined);
});

describe("POST /api/scan — atomic RPC wiring (P0-2 / P0-4)", () => {
  it("blocks a redeem the RPC reports as not-yet-earned (server-side threshold check)", async () => {
    const supabase = makeSupabase({
      selectResult: { data: programRow(), error: null },
      rpcResult: { data: null, error: { message: "reward_not_earned" } },
    });
    requireCapability.mockResolvedValue({
      supabase,
      userId: "staff-1",
      merchantId: MERCHANT_ID,
      role: "staff",
      merchant: {},
    });

    const res = await POST(makeRequest({ pass_id: PASS_ID, action: "redeem" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("reward_not_earned");
    // Nothing should have been pushed to the wallet for a rejected redemption.
    expect(pushWalletUpdate).not.toHaveBeenCalled();
    expect(triggerAutomatedNotification).not.toHaveBeenCalled();
  });

  it("surfaces an RPC-level forbidden result as 403, even if the pre-check passed", async () => {
    const supabase = makeSupabase({
      selectResult: { data: programRow(), error: null },
      rpcResult: { data: null, error: { message: "forbidden" } },
    });
    requireCapability.mockResolvedValue({
      supabase,
      userId: "staff-1",
      merchantId: MERCHANT_ID,
      role: "staff",
      merchant: {},
    });

    const res = await POST(makeRequest({ pass_id: PASS_ID, action: "award" }));
    expect(res.status).toBe(403);
  });

  it("returns the RPC's own progress value on a successful award, not a locally-recomputed one", async () => {
    const rpcProgress = { stamps_collected: 3 };
    const supabase = makeSupabase({
      selectResult: { data: programRow(), error: null },
      rpcResult: {
        data: [
          {
            progress: rpcProgress,
            resulted_in_reward: false,
            reward_description: "Free coffee",
            delta: { stamps_added: 1 },
          },
        ],
        error: null,
      },
    });
    requireCapability.mockResolvedValue({
      supabase,
      userId: "staff-1",
      merchantId: MERCHANT_ID,
      role: "staff",
      merchant: {},
    });

    const res = await POST(makeRequest({ pass_id: PASS_ID, action: "award" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.progress).toEqual(rpcProgress);
    // The RPC call itself is the atomic operation under test — assert the
    // route actually delegates to it instead of writing progress itself.
    expect(supabase.rpc).toHaveBeenCalledWith(
      "record_scan_event",
      expect.objectContaining({ p_pass_id: PASS_ID, p_action: "award" })
    );
    expect(pushWalletUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ progress: rpcProgress })
    );
  });

  it("routes a reward-unlocking award through triggerAutomatedNotification instead of a plain push", async () => {
    const row = programRow();
    row.loyalty_programs.merchants.notification_prefs.reward_unlocked = true;
    const supabase = makeSupabase({
      selectResult: { data: row, error: null },
      rpcResult: {
        data: [
          {
            progress: { stamps_collected: 5 },
            resulted_in_reward: true,
            reward_description: "Free coffee",
            delta: { stamps_added: 1 },
          },
        ],
        error: null,
      },
    });
    requireCapability.mockResolvedValue({
      supabase,
      userId: "staff-1",
      merchantId: MERCHANT_ID,
      role: "staff",
      merchant: {},
    });

    const res = await POST(makeRequest({ pass_id: PASS_ID, action: "award" }));
    expect(res.status).toBe(200);
    expect(triggerAutomatedNotification).toHaveBeenCalledOnce();
    expect(pushWalletUpdate).not.toHaveBeenCalled();
  });

  it("returns 404 when the pass doesn't exist", async () => {
    const supabase = makeSupabase({
      selectResult: { data: null, error: { message: "not found" } },
      rpcResult: { data: null, error: null },
    });
    requireCapability.mockResolvedValue({
      supabase,
      userId: "staff-1",
      merchantId: MERCHANT_ID,
      role: "staff",
      merchant: {},
    });

    const res = await POST(makeRequest({ pass_id: PASS_ID, action: "award" }));
    expect(res.status).toBe(404);
  });

  it("rejects a second rapid scan of the same pass via the rate limiter", async () => {
    checkRateLimit.mockResolvedValue(false);
    requireCapability.mockResolvedValue({
      supabase: makeSupabase({ selectResult: { data: null, error: null }, rpcResult: { data: null, error: null } }),
      userId: "staff-1",
      merchantId: MERCHANT_ID,
      role: "staff",
      merchant: {},
    });

    const res = await POST(makeRequest({ pass_id: PASS_ID, action: "award" }));
    expect(res.status).toBe(429);
  });
});
