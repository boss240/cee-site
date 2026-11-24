/** Per-tab replay token. Storage contains only a random token and a body digest, never form fields. */
type Attempt = { key: string; payloadHash: string };
const memory = new Map<string, Attempt>();
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function leadAttempt(scope: string, body: string): Promise<string> {
  const storageKey = `cee:lead-attempt:${scope}`;
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const payloadHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
  let previous = memory.get(storageKey);
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored) as Attempt;
      if (uuid.test(parsed.key) && /^[0-9a-f]{64}$/.test(parsed.payloadHash)) previous = parsed;
    }
  } catch { /* Storage unavailable: in-memory retry protection remains active. */ }
  const attempt = previous?.payloadHash === payloadHash ? previous : { key: crypto.randomUUID(), payloadHash };
  memory.set(storageKey, attempt);
  try { sessionStorage.setItem(storageKey, JSON.stringify(attempt)); } catch { /* Same-tab memory fallback. */ }
  return attempt.key;
}

export function completeLeadAttempt(scope: string, key: string) {
  const storageKey = `cee:lead-attempt:${scope}`;
  if (memory.get(storageKey)?.key === key) memory.delete(storageKey);
  try {
    const stored = sessionStorage.getItem(storageKey);
    if (stored && JSON.parse(stored).key === key) sessionStorage.removeItem(storageKey);
  } catch { /* No persistent state to clear when storage is unavailable. */ }
}

/** A timed-out browser attempt retains its replay token for the next explicit retry. */
export async function postLead(body: string, key: string): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  try {
    return await fetch("/api/leads", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
