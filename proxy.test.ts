import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { createServerClient } = vi.hoisted(() => ({ createServerClient: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient }));

import { proxy } from "./proxy";

function mockUser(user: { id: string } | null) {
  createServerClient.mockReturnValue({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
  });
}

function req(path: string) {
  return new NextRequest(new URL(path, "http://localhost"));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("proxy.ts — Scanner PWA session-refresh coverage (P0-3)", () => {
  it("redirects an unauthenticated visitor away from /scan-app to /scan-app/login", async () => {
    mockUser(null);
    const res = await proxy(req("/en/scan-app"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/en/scan-app/login");
    expect(createServerClient).toHaveBeenCalled(); // getUser() round trip actually ran
  });

  it("lets an unauthenticated visitor reach /scan-app/login itself (no redirect loop)", async () => {
    mockUser(null);
    const res = await proxy(req("/en/scan-app/login"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("bounces an already-authenticated staff member away from /scan-app/login to /scan-app", async () => {
    mockUser({ id: "staff-1" });
    const res = await proxy(req("/en/scan-app/login"));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/en/scan-app");
  });

  it("lets an authenticated staff member through to /scan-app", async () => {
    mockUser({ id: "staff-1" });
    const res = await proxy(req("/en/scan-app"));
    expect(res.headers.get("location")).toBeNull();
  });

  it("still gates the merchant dashboard the same way it always did", async () => {
    mockUser(null);
    const res = await proxy(req("/en/dashboard"));
    expect(res.headers.get("location")).toBe("http://localhost/en/login");
  });

  it("skips the Supabase round trip entirely for public marketing routes", async () => {
    const res = await proxy(req("/en/pricing"));
    expect(res.headers.get("location")).toBeNull();
    expect(createServerClient).not.toHaveBeenCalled();
  });
});
