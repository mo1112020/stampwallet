const buckets = new Map<string, number>();

export function checkRateLimit(key: string, windowMs = 10_000): boolean {
  const now = Date.now();
  const last = buckets.get(key);
  if (last && now - last < windowMs) {
    return false;
  }
  buckets.set(key, now);
  return true;
}
