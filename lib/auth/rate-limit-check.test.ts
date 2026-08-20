import { beforeEach, describe, expect, it, vi } from "vitest";
import { checkAuthRateLimit } from "./rate-limit-check";

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
});

describe("checkAuthRateLimit", () => {
  it("returns true when the pre-flight check passes", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    expect(await checkAuthRateLimit("login")).toBe(true);
  });

  it("returns false when the pre-flight check is rate-limited", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 429 } as Response);
    expect(await checkAuthRateLimit("login")).toBe(false);
  });

  it("fails open (returns true) on a network error — must never block a legitimate attempt", async () => {
    vi.mocked(fetch).mockRejectedValue(new Error("network down"));
    expect(await checkAuthRateLimit("signup")).toBe(true);
  });

  it("sends the requested action in the request body", async () => {
    const fetchMock = vi.mocked(fetch).mockResolvedValue({ ok: true } as Response);
    await checkAuthRateLimit("password_reset");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/auth/rate-limit-check",
      expect.objectContaining({ body: JSON.stringify({ action: "password_reset" }) })
    );
  });
});
