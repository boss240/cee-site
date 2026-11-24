/**
 * Bounded per-process sliding window of accepted requests (not a distributed quota).
 * Denied requests consume no storage and do not extend the window.
 */
const MAX_BUCKETS = 5000;
const MAX_HITS_PER_BUCKET = 1000;
const MAX_KEY_LENGTH = 1024;
type Bucket = { hits: number[]; max: number; windowMs: number; expiresAt: number };
const buckets = new Map<string, Bucket>();
// Earliest known expiry; may be stale/early after an accepted hit extends a bucket.
let nextExpiry = Infinity;

export function tooManyRequests(key: string, max: number, windowMs: number) {
  if (typeof key !== "string" || key.length > MAX_KEY_LENGTH ||
      !Number.isSafeInteger(max) || max < 1 || max > MAX_HITS_PER_BUCKET ||
      !Number.isSafeInteger(windowMs) || windowMs < 1) return true;
  const now = Date.now();
  if (!Number.isSafeInteger(now) || !Number.isSafeInteger(now + windowMs)) return true;
  let bucket = buckets.get(key);
  if (bucket && now >= bucket.expiresAt) {
    buckets.delete(key);
    bucket = undefined;
  }
  // One active policy per key: a changed policy cannot discard unexpired history.
  if (bucket && (bucket.max !== max || bucket.windowMs !== windowMs)) return true;
  if (!bucket) {
    // A saturated flood cannot trigger a full sweep on every rejected new key.
    if (buckets.size >= MAX_BUCKETS && now >= nextExpiry) {
      nextExpiry = Infinity;
      for (const [k, value] of buckets) {
        if (now >= value.expiresAt) buckets.delete(k);
        else nextExpiry = Math.min(nextExpiry, value.expiresAt);
      }
    }
    if (buckets.size >= MAX_BUCKETS) return true;
    bucket = { hits: [], max, windowMs, expiresAt: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.hits = bucket.hits.filter(t => now - t < bucket.windowMs);
  if (bucket.hits.length >= bucket.max) return true;
  bucket.hits.push(now);
  bucket.expiresAt = now + bucket.windowMs;
  nextExpiry = Math.min(nextExpiry, bucket.expiresAt);
  return false;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
