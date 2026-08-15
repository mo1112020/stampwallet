import { describe, expect, it, vi } from "vitest";
import { isWithinFreePlanNotificationCap } from "./notificationCap";

function makeAdmin(passIdsInOrder: string[]) {
  const limit = vi.fn().mockResolvedValue({
    data: passIdsInOrder.map((pass_id) => ({ pass_id })),
    error: null,
  });
  const order = vi.fn(() => ({ limit }));
  const eq = vi.fn(() => ({ order }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { from } as unknown as Parameters<typeof isWithinFreePlanNotificationCap>[0];
}

describe("isWithinFreePlanNotificationCap", () => {
  it("is true for a customer within the first 100 (Free plan's cap)", async () => {
    const admin = makeAdmin(["pass-a", "pass-b", "pass-c"]);
    expect(await isWithinFreePlanNotificationCap(admin, "program-1", "pass-b")).toBe(true);
  });

  it("is false for a customer the capped query didn't return (beyond the cap)", async () => {
    const admin = makeAdmin(["pass-a", "pass-b"]);
    expect(await isWithinFreePlanNotificationCap(admin, "program-1", "pass-z")).toBe(false);
  });
});
