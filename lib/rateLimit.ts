/**
 * Простий ліміт запитів у пам'яті процесу. Достатньо для одного інстансу;
 * на кількох інстансах кожен рахує окремо (ліміт м'якший, але працює).
 */
const buckets = new Map<string, number[]>();

export function tooManyRequests(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const recent = (buckets.get(key) ?? []).filter((t) => now - t < windowMs);
  recent.push(now);
  buckets.set(key, recent);
  // періодичне прибирання, щоб мапа не росла безмежно
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => now - t >= windowMs)) buckets.delete(k);
  }
  return recent.length > max;
}

export function clientIp(req: Request) {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "local";
}
