import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { isResendConfigured, emailFrom, sendMock } = vi.hoisted(() => ({
  isResendConfigured: vi.fn(() => true),
  emailFrom: vi.fn(() => "WalletOS <hello@walletos.online>"),
  sendMock: vi.fn(),
}));
vi.mock("@/lib/email/client", () => ({
  isResendConfigured,
  emailFrom,
  createResendClient: () => ({ emails: { send: sendMock } }),
}));

/** Minimal per-table fake covering exactly the chains send.ts uses:
 *   .from("email_events").insert({...}).select("id").single()
 *   .from("email_events").update({...}).eq("id", x)                 <- awaited directly
 *   .from("email_suppressions").select("email").eq("email", x).maybeSingle()
 */
function makeAdmin({ suppressed }: { suppressed: boolean }) {
  const updateCalls: Record<string, unknown>[] = [];

  const from = vi.fn((table: string) => {
    if (table === "email_events") {
      return {
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: { id: "event-1" }, error: null }),
          })),
        })),
        update: vi.fn((payload: Record<string, unknown>) => ({
          eq: vi.fn().mockImplementation(() => {
            updateCalls.push(payload);
            return Promise.resolve({ error: null });
          }),
        })),
      };
    }
    if (table === "email_suppressions") {
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn().mockResolvedValue({
              data: suppressed ? { email: "bad@example.com" } : null,
              error: null,
            }),
          })),
        })),
      };
    }
    throw new Error(`unexpected table: ${table}`);
  });

  return { from, updateCalls };
}

vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: vi.fn() }));

const ORIGINAL_DEV_MODE_TO = process.env.RESEND_DEV_MODE_TO;

beforeEach(() => {
  vi.clearAllMocks();
  isResendConfigured.mockReturnValue(true);
  sendMock.mockResolvedValue({ data: { id: "msg-1" }, error: null });
  // resolveRecipient() in send.ts only sends unconditionally in a
  // production env — this exercises the actual send path the same way the
  // app's own dev-safety redirect already does, rather than testing
  // against NODE_ENV directly.
  process.env.RESEND_DEV_MODE_TO = "dev-redirect@example.com";
});

afterEach(() => {
  process.env.RESEND_DEV_MODE_TO = ORIGINAL_DEV_MODE_TO;
});

describe("sendTransactionalEmail — bounce/complaint suppression (P1: no suppression list)", () => {
  it("never calls Resend for a suppressed address, and records why", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = makeAdmin({ suppressed: true });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { sendTransactionalEmail } = await import("./send");
    const result = await sendTransactionalEmail({
      idempotencyKey: "test:1",
      emailType: "upgrade_prompt",
      to: "bad@example.com",
      subject: "Hi",
      react: null as unknown as React.ReactElement,
    });

    expect(sendMock).not.toHaveBeenCalled();
    expect(result).toEqual({ sent: false, skipped: false, error: "suppressed" });
    expect(admin.updateCalls[0]).toMatchObject({ status: "failed" });
  });

  it("sends normally for an address that was never suppressed", async () => {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = makeAdmin({ suppressed: false });
    vi.mocked(createAdminClient).mockReturnValue(admin as unknown as ReturnType<typeof createAdminClient>);

    const { sendTransactionalEmail } = await import("./send");
    const result = await sendTransactionalEmail({
      idempotencyKey: "test:2",
      emailType: "upgrade_prompt",
      to: "good@example.com",
      subject: "Hi",
      react: null as unknown as React.ReactElement,
    });

    expect(sendMock).toHaveBeenCalledOnce();
    expect(result.sent).toBe(true);
  });
});
