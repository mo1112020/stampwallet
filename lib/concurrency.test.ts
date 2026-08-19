import { describe, expect, it, vi } from "vitest";
import { processInBatches } from "./concurrency";

describe("processInBatches", () => {
  it("processes every item and reports correct succeeded/failed counts", async () => {
    const items = Array.from({ length: 7 }, (_, i) => i);
    const seen: number[] = [];

    const result = await processInBatches(items, async (item) => {
      seen.push(item);
      if (item === 3) throw new Error("boom");
    }, 3);

    expect(seen.sort((a, b) => a - b)).toEqual(items);
    expect(result.succeeded).toBe(6);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0]).toEqual({ index: 3, error: expect.any(Error) });
  });

  it("never runs more than batchSize items concurrently", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 11 }, (_, i) => i);

    await processInBatches(
      items,
      async () => {
        inFlight++;
        maxInFlight = Math.max(maxInFlight, inFlight);
        await new Promise((r) => setTimeout(r, 5));
        inFlight--;
      },
      4
    );

    expect(maxInFlight).toBeLessThanOrEqual(4);
  });

  it("isolates one item's failure from the rest of its own batch", async () => {
    const handler = vi.fn(async (item: number) => {
      if (item === 1) throw new Error("bad item");
    });

    const result = await processInBatches([0, 1, 2], handler, 10);

    expect(handler).toHaveBeenCalledTimes(3);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(1);
  });

  it("handles an empty list without error", async () => {
    const result = await processInBatches([], async () => {});
    expect(result).toEqual({ succeeded: 0, failed: 0, errors: [] });
  });

  it("defaults to a batch size of 20", async () => {
    let inFlight = 0;
    let maxInFlight = 0;
    const items = Array.from({ length: 45 }, (_, i) => i);

    await processInBatches(items, async () => {
      inFlight++;
      maxInFlight = Math.max(maxInFlight, inFlight);
      await new Promise((r) => setTimeout(r, 1));
      inFlight--;
    });

    expect(maxInFlight).toBeLessThanOrEqual(20);
    expect(maxInFlight).toBeGreaterThan(4); // actually exercised the default, not accidentally batch-of-1
  });
});
