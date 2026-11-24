import type { BackupQuote, BackupReservation } from "./backupBudget";
import type { BackupOutcome, BackupProvider } from "./backupProviders";

const MAX_BODY_BYTES = 512;
const DEADLINE_MS = 10_000;
const PROMPT = "Reply with OK only. This is a synthetic CEE connection check; no customer information.";
const headers = { "Cache-Control": "private, no-store" };
type Status = "success" | "accounting_unresolved" | "denied" | "unconfigured" | "unknown" | "refusal";
export type CanaryDependencies = {
  authorize: () => Promise<boolean>;
  origin: () => string;
  enabled: () => boolean;
  credential: (provider: BackupProvider) => string | undefined;
  quote: (provider: BackupProvider) => BackupQuote | null;
  reserve: (quote: BackupQuote) => Promise<BackupReservation | null>;
  invoke: (request: { provider: BackupProvider; input: string; signal: AbortSignal; maxOutputTokens: number; reservation: BackupReservation; apiKey: string; enabled: boolean }) => Promise<BackupOutcome>;
  settle: (receipt: BackupReservation, usage: {kind: "verified_final_usage"; actualCostMicroUSD: number}) => Promise<boolean>;
  /** Test clock only; runtime uses monotonic performance.now. Never request data. */
  now?: () => number;
};

/** One admin-authorized synthetic invocation, not a retry/fallback endpoint.
 * A duplicate POST is a distinct budgeted attempt; no exactly-once claim.
 */
export async function runBackupCanary(request: Request, dependencies: CanaryDependencies): Promise<Response> {
  const now = dependencies.now ?? (() => performance.now());
  const started = now();
  const deadline = started + DEADLINE_MS;
  const controller = new AbortController();
  const clientAborted = () => controller.abort();
  request.signal.addEventListener("abort", clientAborted, {once: true});
  if (request.signal.aborted) controller.abort();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let provider: BackupProvider | undefined;
  const expired = () => controller.signal.aborted || now() >= deadline;
  const response = (status: Status, httpStatus: number) => Response.json({
    ...(provider ? {provider} : {}), status, elapsedMs: Math.max(0, Math.min(DEADLINE_MS, Math.round(now() - started))),
  }, {status: httpStatus, headers});
  const work = async (): Promise<Response> => {
    if (request.method !== "POST") return new Response(null, {status: 405, headers: {...headers, Allow: "POST"}});
    if (!await dependencies.authorize()) return response("denied", 401);
    if (expired()) return response("unknown", 504);
    // Configuration supplies the trusted origin; never derive it from Host or URL.
    const origin = request.headers.get("origin");
    if (!origin || origin === "null" || origin !== dependencies.origin() || request.headers.get("sec-fetch-site") === "cross-site") return response("denied", 403);
    if (request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json") return response("denied", 400);
    if (new URL(request.url).search) return response("denied", 400);
    if (!request.body) return response("denied", 400);
    const reader = request.body.getReader();
    const decoder = new TextDecoder("utf-8", {fatal: true});
    let size = 0;
    let body = "";
    const cancel = () => { void reader.cancel().catch(() => {}); };
    controller.signal.addEventListener("abort", cancel, {once: true});
    try {
      for (;;) {
        if (expired()) return response("unknown", 504);
        const chunk = await reader.read();
        if (chunk.done) break;
        size += chunk.value.byteLength;
        if (size > MAX_BODY_BYTES) return response("denied", 413);
        body += decoder.decode(chunk.value, {stream: true});
      }
      body += decoder.decode();
    } finally {
      controller.signal.removeEventListener("abort", cancel);
      await reader.cancel().catch(() => {});
      reader.releaseLock();
    }
    if (expired()) return response("unknown", 504);
    let data: unknown;
    try { data = JSON.parse(body); } catch { return response("denied", 400); }
    if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).length !== 1 || !("provider" in data) ||
        (data.provider !== "openai" && data.provider !== "anthropic")) return response("denied", 400);
    provider = data.provider;
    if (!dependencies.enabled()) return response("unconfigured", 503);
    const quote = dependencies.quote(provider);
    const apiKey = dependencies.credential(provider);
    if (!quote || !apiKey?.trim() || /[\r\n]/.test(apiKey)) return response("unconfigured", 503);
    if (expired()) return response("unknown", 504);
    const receipt = await dependencies.reserve(quote);
    // Late/uncertain admission may be committed: never refund or dispatch late.
    if (expired()) return response("unknown", 504);
    if (!receipt) return response("denied", 503);
    const outcome = await dependencies.invoke({provider, input: PROMPT, signal: controller.signal,
      maxOutputTokens: 64, reservation: receipt, apiKey, enabled: true});
    if (expired()) return response("unknown", 504);
    if (!outcome.ok) return response(outcome.failure.status === 403 ? "refusal" : "unknown", 502);
    // Only validated final usage can settle; unsuccessful settlement retains holds.
    let settled = false;
    try { settled = await dependencies.settle(receipt, {kind: "verified_final_usage", actualCostMicroUSD: outcome.actualCostMicroUSD}); }
    catch { /* Response is known, accounting remains held; do not repeat the call. */ }
    if (expired()) return response("unknown", 504);
    return response(settled ? "success" : "accounting_unresolved", 200);
  };
  try {
    const timeout = new Promise<Response>(resolve => {
      timer = setTimeout(() => { controller.abort(); resolve(response("unknown", 504)); }, DEADLINE_MS);
    });
    return await Promise.race([work().catch(() => response("unknown", 503)), timeout]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
    request.signal.removeEventListener("abort", clientAborted);
  }
}
