/**
 * Runs `handler` over `items` in fixed-size chunks (default 20), awaiting
 * each chunk fully (via Promise.allSettled — one item's rejection can't take
 * down its batch-mates) before starting the next. Not a continuously-full
 * worker pool, just a straightforward bound on "how many of these run at
 * once" — deliberately simple over a fully general concurrency-limiter,
 * since every caller here is a bounded, one-shot fan-out (a campaign send, a
 * cron sweep), not a long-lived queue.
 *
 * Exists because every wallet-push fan-out in this codebase (program
 * broadcasts, campaign sends, automated triggers, expiration refreshes) used
 * to run one target fully at a time — correct, but on a large list (a
 * 1,000-customer campaign, a merchant's daily automated-trigger sweep) that
 * serial pace risks running out the serverless function's time budget
 * partway through, silently leaving the remainder never attempted at all.
 * Running a bounded batch concurrently finishes the same total work in a
 * fraction of the wall-clock time without removing the per-item isolation
 * (see BatchResult) the original sequential loops already had.
 */
export type BatchResult = {
  succeeded: number;
  failed: number;
  /** One entry per failed item, in case a caller wants to log/report specifics beyond the counts. */
  errors: { index: number; error: unknown }[];
};

export async function processInBatches<T>(
  items: readonly T[],
  handler: (item: T, index: number) => Promise<void>,
  batchSize = 20
): Promise<BatchResult> {
  const result: BatchResult = { succeeded: 0, failed: 0, errors: [] };

  for (let start = 0; start < items.length; start += batchSize) {
    const batch = items.slice(start, start + batchSize);
    const settled = await Promise.allSettled(batch.map((item, i) => handler(item, start + i)));
    settled.forEach((outcome, i) => {
      if (outcome.status === "fulfilled") {
        result.succeeded++;
      } else {
        result.failed++;
        result.errors.push({ index: start + i, error: outcome.reason });
      }
    });
  }

  return result;
}
