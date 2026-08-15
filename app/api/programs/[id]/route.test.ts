import { beforeEach, describe, expect, it, vi } from "vitest";

const { requireMerchant } = vi.hoisted(() => ({ requireMerchant: vi.fn() }));
vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return { ...actual, requireMerchant };
});

const { pushProgramUpdateToAllCustomers } = vi.hoisted(() => ({
  pushProgramUpdateToAllCustomers: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/wallet/push", () => ({ pushProgramUpdateToAllCustomers }));

import { DELETE } from "./route";

const PROGRAM_ID = "program-1";
const MERCHANT_ID = "merchant-1";

/**
 * Fake matching the two `.from()` calls DELETE makes:
 *   .from("loyalty_programs").select("*").eq("id", id).single()
 *   .from("customer_progress").select("id", {count:"exact",head:true}).eq("program_id", id)   <- awaited directly, no .single()
 *   .from("loyalty_programs").delete().eq("id", id).select("id").single()
 */
function makeSupabase({
  existingProgram,
  customerCount,
  deleteResult,
}: {
  existingProgram: { id: string; merchant_id: string } | null;
  customerCount: number;
  deleteResult?: { data: unknown; error: unknown };
}) {
  const from = vi.fn((table: string) => {
    if (table === "loyalty_programs") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: existingProgram, error: null }),
          })),
        })),
        delete: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn().mockResolvedValue(deleteResult ?? { data: { id: PROGRAM_ID }, error: null }),
            })),
          })),
        })),
      };
    }
    if (table === "customer_progress") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn().mockResolvedValue({ count: customerCount, error: null }),
        })),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });
  return { from };
}

function makeRequest() {
  return new Request(`http://localhost/api/programs/${PROGRAM_ID}`, { method: "DELETE" });
}

beforeEach(() => vi.clearAllMocks());

describe("DELETE /api/programs/[id] — program deletion data-loss guard (P0-1)", () => {
  it("blocks a hard delete when customers are enrolled, and never calls delete()", async () => {
    const supabase = makeSupabase({
      existingProgram: { id: PROGRAM_ID, merchant_id: MERCHANT_ID },
      customerCount: 3,
    });
    requireMerchant.mockResolvedValue({ supabase, merchant: {}, userId: MERCHANT_ID });

    const res = await DELETE(new Request("http://x"), { params: Promise.resolve({ id: PROGRAM_ID }) });
    const json = await res.json();

    expect(res.status).toBe(409);
    expect(json.error.code).toBe("program_has_customers");
    expect(json.error.message).toMatch(/3 enrolled customers/);
    // Ownership + count were checked, but the destructive call itself was
    // never reached — the loyalty_programs builder's delete() was never
    // invoked at all.
    const loyaltyProgramsCalls = supabase.from.mock.calls.filter(([t]) => t === "loyalty_programs");
    expect(loyaltyProgramsCalls.length).toBe(1); // only the initial ownership SELECT
  });

  it("allows the delete once no customers are enrolled", async () => {
    const supabase = makeSupabase({
      existingProgram: { id: PROGRAM_ID, merchant_id: MERCHANT_ID },
      customerCount: 0,
    });
    requireMerchant.mockResolvedValue({ supabase, merchant: {}, userId: MERCHANT_ID });

    const res = await DELETE(new Request("http://x"), { params: Promise.resolve({ id: PROGRAM_ID }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data.id).toBe(PROGRAM_ID);
  });

  it("still enforces ownership before even checking customer count", async () => {
    const supabase = makeSupabase({
      existingProgram: { id: PROGRAM_ID, merchant_id: "someone-else" },
      customerCount: 0,
    });
    requireMerchant.mockResolvedValue({ supabase, merchant: {}, userId: MERCHANT_ID });

    const res = await DELETE(new Request("http://x"), { params: Promise.resolve({ id: PROGRAM_ID }) });
    expect(res.status).toBe(403);
  });

  it("404s cleanly for a program that doesn't exist", async () => {
    const supabase = makeSupabase({ existingProgram: null, customerCount: 0 });
    requireMerchant.mockResolvedValue({ supabase, merchant: {}, userId: MERCHANT_ID });

    const res = await DELETE(new Request("http://x"), { params: Promise.resolve({ id: PROGRAM_ID }) });
    expect(res.status).toBe(404);
  });
});
