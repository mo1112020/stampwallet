import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const { verifyMock } = vi.hoisted(() => ({ verifyMock: vi.fn() }));
vi.mock("@/lib/email/client", () => ({
  createResendClient: () => ({ webhooks: { verify: verifyMock } }),
}));

function makeAdmin({ recipientEmail }: { recipientEmail: string | null }) {
  const upsertCalls: { table: string; payload: unknown; options: unknown }[] = [];
  const updateSelectResult = { data: recipientEmail ? { recipient_email: recipientEmail } : null, error: null };

  const from = vi.fn((table: string) => {
    if (table === "email_events") {
      return {
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              maybeSingle: vi.fn().mockResolvedValue(updateSelectResult),
            })),
          })),
        })),
      };
    }
    if (table === "email_suppressions") {
      return {
        upsert: vi.fn((payload: unknown, options: unknown) => {
          upsertCalls.push({ table, payload, options });
          return Promise.resolve({ error: null });
        }),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });

  return { from, upsertCalls };
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const ORIGINAL_SECRET = process.env.RESEND_WEBHOOK_SECRET;

beforeEach(() => {
  vi.clearAllMocks();
  process.env.RESEND_WEBHOOK_SECRET = "whsec_test";
});

afterAll(() => {
  process.env.RESEND_WEBHOOK_SECRET = ORIGINAL_SECRET;
});

function makeRequest() {
  return new Request("http://localhost/api/webhooks/resend", {
    method: "POST",
    headers: { "svix-id": "id", "svix-timestamp": "1", "svix-signature": "sig" },
    body: "{}",
  });
}

describe("Resend webhook — bounce/complaint suppression (P1: no suppression list)", () => {
  it("suppresses the recipient on email.bounced", async () => {
    verifyMock.mockReturnValue({ type: "email.bounced", data: { email_id: "msg-1", bounce: { message: "hard bounce" } } });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = makeAdmin({ recipientEmail: "Bounced@Example.com" });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { POST } = await import("./route");
    const res = await POST(makeRequest());
    expect(res.status).toBe(200);

    expect(admin.upsertCalls).toHaveLength(1);
    expect(admin.upsertCalls[0].payload).toEqual({ email: "bounced@example.com", reason: "bounced" });
  });

  it("suppresses the recipient on email.complained", async () => {
    verifyMock.mockReturnValue({ type: "email.complained", data: { email_id: "msg-2" } });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = makeAdmin({ recipientEmail: "spam-reporter@example.com" });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { POST } = await import("./route");
    await POST(makeRequest());

    expect(admin.upsertCalls[0].payload).toEqual({ email: "spam-reporter@example.com", reason: "complained" });
  });

  it("does NOT suppress on a generic email.failed (not a bounce or complaint)", async () => {
    verifyMock.mockReturnValue({ type: "email.failed", data: { email_id: "msg-3", failed: { reason: "invalid address" } } });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = makeAdmin({ recipientEmail: "someone@example.com" });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { POST } = await import("./route");
    await POST(makeRequest());

    expect(admin.upsertCalls).toHaveLength(0);
  });

  it("does NOT suppress on email.delivered (not a failure at all)", async () => {
    verifyMock.mockReturnValue({ type: "email.delivered", data: { email_id: "msg-4" } });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = makeAdmin({ recipientEmail: "someone@example.com" });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { POST } = await import("./route");
    await POST(makeRequest());

    expect(admin.upsertCalls).toHaveLength(0);
  });

  it("rejects an invalid signature before touching the database", async () => {
    verifyMock.mockImplementation(() => {
      throw new Error("bad signature");
    });
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = makeAdmin({ recipientEmail: "someone@example.com" });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { POST } = await import("./route");
    const res = await POST(makeRequest());

    expect(res.status).toBe(401);
    expect(admin.from).not.toHaveBeenCalled();
  });
});
