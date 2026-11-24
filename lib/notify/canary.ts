import { normalizedRecipient, type CanaryChannel } from "./canaryRecipient";
export { normalizedRecipient } from "./canaryRecipient";
export type CanaryStatus = "accepted" | "rejected" | "unconfigured" | "unknown";
export type CanaryInput = { channel: CanaryChannel; recipient: string; canaryId: string };
export type CanaryDependencies = {
  authorize: () => Promise<boolean>;
  origin: () => string;
  recipients: (channel: CanaryChannel) => string[];
  send: (input: CanaryInput) => Promise<CanaryStatus>;
};
const headers = { "Cache-Control": "private, no-store" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;


/** Deliberately ONE controlled call, not an idempotent relay or queue.
 * No retry on any outcome. A lost response can follow provider acceptance.
 */
export async function runNotificationCanary(request: Request, deps: CanaryDependencies): Promise<Response> {
  const reply = (status: string, code: number, input?: CanaryInput) => Response.json({ status,
    ...(input ? { channel: input.channel, canaryId: input.canaryId } : {}) }, { status: code, headers });
  try {
    if (request.method !== "POST") return reply("denied", 405);
    if (!await deps.authorize()) return reply("denied", 401);
    if (request.headers.get("origin") !== deps.origin() || request.headers.get("sec-fetch-site") === "cross-site") return reply("denied", 403);
    if (new URL(request.url).search || request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json" || !request.body) return reply("invalid_request", 400);
    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", { fatal: true });
    let body = "", size = 0;
    let bodyTimedOut = false;
    const timer = setTimeout(() => { bodyTimedOut = true; void reader.cancel().catch(() => {}); }, 2_000);
    let bodyComplete = false;
    try {
      for (;;) {
        const part = await reader.read();
        if (part.done) { bodyComplete = true; break; }
        size += part.value.byteLength;
        if (size > 512) return reply("invalid_request", 413);
        body += decoder.decode(part.value, { stream: true });
      }
      body += decoder.decode();
    } finally { clearTimeout(timer); await reader.cancel().catch(() => {}); reader.releaseLock(); }
    if (!bodyComplete || bodyTimedOut || request.signal.aborted) return reply("invalid_request", 400);
    let data: unknown;
    try { data = JSON.parse(body); } catch { return reply("invalid_request", 400); }
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).sort().join(",") !== "canaryId,channel,recipient") return reply("invalid_request", 400);
    const d = data as Record<string, unknown>;
    if ((d.channel !== "email" && d.channel !== "telegram") || typeof d.recipient !== "string" || typeof d.canaryId !== "string" || !uuid.test(d.canaryId)) return reply("invalid_request", 400);
    const recipient = normalizedRecipient(d.channel, d.recipient);
    if (!recipient || !deps.recipients(d.channel).some(value => normalizedRecipient(d.channel as CanaryChannel, value) === recipient)) return reply("recipient_not_allowed", 400);
    const input: CanaryInput = { channel: d.channel, recipient, canaryId: d.canaryId.toLowerCase() };
    if (request.signal.aborted) return reply("invalid_request", 400);
    let status: CanaryStatus = "unknown";
    try { status = await deps.send(input); } catch { /* Never retry a possibly accepted send. */ }
    console.info(JSON.stringify({ event: "notification_canary_completed", channel: input.channel, canaryId: input.canaryId, status }));
    return reply(status, status === "accepted" ? 200 : 502, input);
  } catch { return reply("unknown", 503); }
}
