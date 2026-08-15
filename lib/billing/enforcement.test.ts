import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveSegmentTargets } = vi.hoisted(() => ({ resolveSegmentTargets: vi.fn() }));
vi.mock("@/lib/notifications/segments", () => ({ resolveSegmentTargets }));

const { triggerAutomatedNotification } = vi.hoisted(() => ({ triggerAutomatedNotification: vi.fn() }));
vi.mock("@/lib/notifications/campaigns", () => ({ triggerAutomatedNotification }));

const { sendTransactionalEmail } = vi.hoisted(() => ({ sendTransactionalEmail: vi.fn() }));
vi.mock("@/lib/email/send", () => ({ sendTransactionalEmail }));

// Both new email templates are React components — stub them so this test
// doesn't need a JSX-rendering environment, it only asserts on the props
// enforcement.tsx computes and passes in.
vi.mock("@/components/emails/billing-grace-warning", () => ({ BillingGraceWarningEmail: () => null }));
vi.mock("@/components/emails/billing-enforced", () => ({ BillingEnforcedEmail: () => null }));

type UpdateCall = { table: string; payload: Record<string, unknown>; filters: [string, unknown][] };

function makeAdminMock(tableData: Record<string, unknown[]>) {
  const updateCalls: UpdateCall[] = [];

  function chain(table: string, mode: "select" | "update", payload?: Record<string, unknown>) {
    const filters: [string, unknown][] = [];
    const obj: {
      select: () => typeof obj;
      eq: (col: string, val: unknown) => typeof obj;
      neq: (col: string, val: unknown) => typeof obj;
      not: (col: string, op: string, val: unknown) => typeof obj;
      is: (col: string, val: unknown) => typeof obj;
      lte: (col: string, val: unknown) => typeof obj;
      order: () => typeof obj;
      limit: () => typeof obj;
      single: () => Promise<{ data: unknown; error: null }>;
      maybeSingle: () => Promise<{ data: unknown; error: null }>;
      then: (resolve: (v: { data: unknown; error: null }) => void) => void;
    } = {
      select: () => chain(table, mode, payload) as unknown as typeof obj,
      eq: (col, val) => {
        filters.push([col, val]);
        return obj;
      },
      neq: (col, val) => {
        filters.push([`neq:${col}`, val]);
        return obj;
      },
      not: () => obj,
      is: () => obj,
      lte: () => obj,
      order: () => obj,
      limit: () => obj,
      single: async () => {
        const rows = (tableData[table] ?? []) as { id: unknown }[];
        const idFilter = filters.find(([c]) => c === "id");
        const row = idFilter ? rows.find((r) => r.id === idFilter[1]) : rows[0];
        return { data: row ?? null, error: null };
      },
      maybeSingle: () => obj.single(),
      then: (resolve) => {
        if (mode === "update") {
          updateCalls.push({ table, payload: payload ?? {}, filters });
          resolve({ data: null, error: null });
        } else {
          resolve({ data: tableData[table] ?? [], error: null });
        }
      },
    };
    return obj;
  }

  const admin = {
    from: (table: string) => ({
      select: () => chain(table, "select"),
      update: (payload: Record<string, unknown>) => chain(table, "update", payload),
    }),
    auth: {
      admin: {
        getUserById: vi.fn().mockResolvedValue({ data: { user: { email: "owner@example.com" } } }),
      },
    },
  };

  return { admin, updateCalls };
}

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  resolveSegmentTargets.mockResolvedValue([]);
  sendTransactionalEmail.mockResolvedValue({ sent: true, skipped: false, providerMessageId: "x" });
});

const MERCHANT_ID = "merchant-1";

function baseMerchant(overrides: Record<string, unknown> = {}) {
  return {
    id: MERCHANT_ID,
    business_name: "Test Co",
    locale_default: "en",
    plan: "free",
    subscription_status: "canceled",
    billing_enforced_at: null,
    ...overrides,
  };
}

describe("enforceBillingLimits — oldest survives, everything else pauses", () => {
  it("keeps only the oldest active program/location, pauses the rest, suspends all staff", async () => {
    resolveSegmentTargets.mockResolvedValue([
      { customerProgressId: "cp-1", passId: "pass-1", googleObjectId: null, program: {}, merchant: {}, progress: {}, enrolledAt: "2026-01-01" },
    ]);
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { admin, updateCalls } = makeAdminMock({
      merchants: [baseMerchant()],
      loyalty_programs: [
        { id: "prog-old", name: "Original Program", created_at: "2026-01-01" },
        { id: "prog-new", name: "Second Program", created_at: "2026-02-01" },
      ],
      store_locations: [
        { id: "loc-old", name: "Main St", created_at: "2026-01-01" },
        { id: "loc-new", name: "Second Ave", created_at: "2026-02-01" },
      ],
      staff_accounts: [{ id: "staff-1", invited_email: "a@b.com" }],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { enforceBillingLimits } = await import("./enforcement");
    await enforceBillingLimits(MERCHANT_ID);

    const programUpdates = updateCalls.filter((c) => c.table === "loyalty_programs");
    expect(programUpdates).toHaveLength(1);
    expect(programUpdates[0].filters).toContainEqual(["id", "prog-new"]);
    expect(programUpdates[0].payload).toEqual({ is_active: false, deactivated_by_billing: true });

    const locationUpdates = updateCalls.filter((c) => c.table === "store_locations");
    expect(locationUpdates).toHaveLength(1);
    expect(locationUpdates[0].filters).toContainEqual(["id", "loc-new"]);

    const staffUpdates = updateCalls.filter((c) => c.table === "staff_accounts");
    expect(staffUpdates).toHaveLength(1);
    expect(staffUpdates[0].filters).toContainEqual(["id", "staff-1"]);
    expect(staffUpdates[0].payload).toEqual({ suspended_by_billing: true });

    const merchantUpdates = updateCalls.filter((c) => c.table === "merchants");
    expect(merchantUpdates.some((c) => "billing_enforced_at" in c.payload)).toBe(true);

    expect(sendTransactionalEmail).toHaveBeenCalledOnce();
    expect(triggerAutomatedNotification).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: "billing_paused" })
    );
  });

  it("refuses to enforce a merchant whose access is actually active (safety guard)", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { admin, updateCalls } = makeAdminMock({
      merchants: [baseMerchant({ subscription_status: "active" })],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { enforceBillingLimits } = await import("./enforcement");
    await enforceBillingLimits(MERCHANT_ID);

    expect(updateCalls).toHaveLength(0);
    expect(sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("does nothing when there's nothing to pause (one program, one location, no staff)", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { admin, updateCalls } = makeAdminMock({
      merchants: [baseMerchant()],
      loyalty_programs: [{ id: "prog-only", name: "Only Program", created_at: "2026-01-01" }],
      store_locations: [{ id: "loc-only", name: "Only Location", created_at: "2026-01-01" }],
      staff_accounts: [],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { enforceBillingLimits } = await import("./enforcement");
    await enforceBillingLimits(MERCHANT_ID);

    expect(updateCalls.filter((c) => c.table === "loyalty_programs")).toHaveLength(0);
    expect(updateCalls.filter((c) => c.table === "store_locations")).toHaveLength(0);
    expect(updateCalls.filter((c) => c.table === "staff_accounts")).toHaveLength(0);
    // billing_enforced_at is still stamped even when nothing needed pausing.
    expect(updateCalls.some((c) => c.table === "merchants" && "billing_enforced_at" in c.payload)).toBe(true);
  });
});

describe("restoreBillingLimits — reverses exactly what enforcement turned off", () => {
  it("reactivates flagged programs/locations/staff and clears grace state", async () => {
    resolveSegmentTargets.mockResolvedValue([
      { customerProgressId: "cp-1", passId: "pass-1", googleObjectId: null, program: {}, merchant: {}, progress: {}, enrolledAt: "2026-01-01" },
    ]);
    const { admin, updateCalls } = makeAdminMock({
      loyalty_programs: [{ id: "prog-new" }],
    });

    const { restoreBillingLimits } = await import("./enforcement");
    await restoreBillingLimits(admin as unknown as Parameters<typeof restoreBillingLimits>[0], MERCHANT_ID);

    const programUpdate = updateCalls.find((c) => c.table === "loyalty_programs");
    expect(programUpdate?.payload).toEqual({ is_active: true, deactivated_by_billing: false });

    const locationUpdate = updateCalls.find((c) => c.table === "store_locations");
    expect(locationUpdate?.payload).toEqual({ is_active: true, deactivated_by_billing: false });

    const staffUpdate = updateCalls.find((c) => c.table === "staff_accounts");
    expect(staffUpdate?.payload).toEqual({ suspended_by_billing: false });

    const merchantUpdate = updateCalls.find((c) => c.table === "merchants");
    expect(merchantUpdate?.payload).toEqual({ billing_grace_ends_at: null, billing_enforced_at: null });

    expect(triggerAutomatedNotification).toHaveBeenCalledWith(
      expect.objectContaining({ trigger: "billing_restored" })
    );
  });
});

describe("sweepExpiredBillingGrace — only enforces merchants past grace and not yet enforced", () => {
  it("skips a merchant that regained access since the sweep query ran", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { admin } = makeAdminMock({
      merchants: [baseMerchant({ subscription_status: "active" })],
    });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { sweepExpiredBillingGrace } = await import("./enforcement");
    const result = await sweepExpiredBillingGrace();

    expect(result.enforced).toBe(0);
  });
});
