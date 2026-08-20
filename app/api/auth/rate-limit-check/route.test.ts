import { beforeEach, describe, expect, it, vi } from "vitest";

const { checkRateLimit } = vi.hoisted(() => ({ checkRateLimit: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit }));

import { POST } from "./route";

function makeRequest(body: unknown, ip = "1.2.3.4") {
  return new Request("http://localhost/api/auth/rate-limit-check", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe("POST /api/auth/rate-limit-check — pre-flight throttle (P1: no rate limiting on auth endpoints)", () => {
  it.each(["login", "signup", "password_reset"])("allows a fresh %s attempt through", async (action) => {
    checkRateLimit.mockResolvedValue(true);
    const res = await POST(makeRequest({ action }));
    expect(res.status).toBe(200);
    expect(checkRateLimit).toHaveBeenCalledWith(
      `auth:${action}:1.2.3.4`,
      expect.any(Number),
      { failOpen: false }
    );
  });

  it("returns 429 when the throttle blocks the attempt", async () => {
    checkRateLimit.mockResolvedValue(false);
    const res = await POST(makeRequest({ action: "login" }));
    const json = await res.json();
    expect(res.status).toBe(429);
    expect(json.error.code).toBe("rate_limited");
  });

  it("keys distinct actions from the same IP separately (a signup attempt doesn't throttle login)", async () => {
    checkRateLimit.mockResolvedValue(true);
    await POST(makeRequest({ action: "login" }));
    await POST(makeRequest({ action: "signup" }));
    expect(checkRateLimit).toHaveBeenNthCalledWith(1, "auth:login:1.2.3.4", expect.any(Number), { failOpen: false });
    expect(checkRateLimit).toHaveBeenNthCalledWith(2, "auth:signup:1.2.3.4", expect.any(Number), { failOpen: false });
  });

  it("keys distinct IPs separately for the same action", async () => {
    checkRateLimit.mockResolvedValue(true);
    await POST(makeRequest({ action: "login" }, "1.1.1.1"));
    await POST(makeRequest({ action: "login" }, "2.2.2.2"));
    expect(checkRateLimit).toHaveBeenNthCalledWith(1, "auth:login:1.1.1.1", expect.any(Number), { failOpen: false });
    expect(checkRateLimit).toHaveBeenNthCalledWith(2, "auth:login:2.2.2.2", expect.any(Number), { failOpen: false });
  });

  it("rejects an unrecognized action without calling the rate limiter", async () => {
    const res = await POST(makeRequest({ action: "delete_everything" }));
    expect(res.status).toBe(400);
    expect(checkRateLimit).not.toHaveBeenCalled();
  });

  it("rejects a missing/malformed body without calling the rate limiter", async () => {
    const res = await POST(new Request("http://localhost/x", { method: "POST", body: "not json" }));
    expect(res.status).toBe(400);
    expect(checkRateLimit).not.toHaveBeenCalled();
  });
});
