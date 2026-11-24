/** Server-only, inert adapters. No environment reads or requests at import time.
 * Enablement, durable admission and settlement belong to the reviewed caller.
 * Tariffs bound THIS application's admitted usage, not taxes/account-wide bills.
 */
import type { BackupQuote, BackupReservation } from "./backupBudget";
import type { ObservedFailure } from "./failoverPolicy";

export type BackupProvider = "openai" | "anthropic";
export const BACKUP_MODELS = Object.freeze({ openai: "gpt-5.6-luna", anthropic: "claude-haiku-5-5" });
export const BACKUP_PRICING_VERSION = "2026-10-28-text-v1";
const PRICING_FROM = Date.parse("2026-10-28T00:00:00Z");
const PRICING_UNTIL = Date.parse("2026-11-04T00:00:00Z");
const QUOTE = 600_000;
const MAX_INPUT_BYTES = 24_000;
const MAX_OUTPUT_TOKENS = 1_500;
const MAX_RESPONSE_BYTES = 262_144;
const MAX_TEXT_BYTES = 24_000;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
// Best-effort same-object reuse guard only; durable admission is the caller's authority.
const usedReceipts = new WeakSet<BackupReservation>();
const bytes = (s: string) => new TextEncoder().encode(s).length;
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const count = (v: unknown, max: number): v is number => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 && v <= max;
const failed = (status?: number): BackupOutcome => ({ ok: false, failure: status === undefined ? {} : { status } });
export type BackupOutcome =
  | { ok: true; text: string; actualCostMicroUSD: number }
  | { ok: false; failure: ObservedFailure };

/** Full model-context worst rate, NOT a heuristic text/token estimate.
 * OpenAI: 1.05M*0.50 + 1500*1.80 = 527700 microUSD.
 * Anthropic without cache writes: 1M*0.50 + 1500*2.50 = 503750 microUSD.
 * Round each up to 600000. Unknown usage retains the whole reservation.
 */
export function quoteFor(provider: BackupProvider, now = Date.now()): BackupQuote | null {
  if ((provider !== "openai" && provider !== "anthropic") || !Number.isFinite(now) || now < PRICING_FROM || now >= PRICING_UNTIL) return null;
  return Object.freeze({ provider, model: BACKUP_MODELS[provider], pricingVersion: BACKUP_PRICING_VERSION, maxCostMicroUSD: QUOTE });
}

async function readBoundedJSON(response: Response): Promise<unknown> {
  if (!response.headers.get("content-type")?.toLowerCase().includes("application/json") || !response.body) throw new Error("invalid_response");
  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8", { fatal: true });
  let size = 0;
  let body = "";
  try {
    for (;;) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.byteLength;
      if (size > MAX_RESPONSE_BYTES) throw new Error("response_limit");
      body += decoder.decode(result.value, { stream: true });
    }
    body += decoder.decode();
    return JSON.parse(body);
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

function parseResolved(provider: BackupProvider, value: unknown, maxOutput: number): BackupOutcome {
  if (!object(value) || value.model !== BACKUP_MODELS[provider]) return failed();
  const texts: string[] = [];
  if (provider === "openai") {
    if (!Array.isArray(value.output)) return failed();
    for (const item of value.output) {
      if (!object(item)) return failed();
      if (item.type === "reasoning") continue;
      if (item.type !== "message" || item.role !== "assistant" || !Array.isArray(item.content)) return failed();
      for (const block of item.content) {
        if (!object(block)) return failed();
        if (block.type === "refusal") return failed(403);
        if (block.type !== "output_text" || typeof block.text !== "string") return failed();
        texts.push(block.text);
      }
    }
    if (value.status !== "completed") return failed();
  } else {
    if (value.stop_reason === "refusal") return failed(403);
    if (value.type !== "message" || value.role !== "assistant" || value.stop_reason !== "end_turn" || !Array.isArray(value.content)) return failed();
    for (const block of value.content) {
      if (!object(block)) return failed();
      if (block.type === "thinking" || block.type === "redacted_thinking") continue;
      if (block.type !== "text" || typeof block.text !== "string") return failed();
      texts.push(block.text);
    }
  }
  const text = texts.join("\n").trim();
  if (!text || bytes(text) > MAX_TEXT_BYTES || !object(value.usage)) return failed();
  const usage = value.usage;
  const context = provider === "openai" ? 1_050_000 : 1_000_000;
  if (!count(usage.input_tokens, context) || !count(usage.output_tokens, maxOutput)) return failed();
  if (provider === "openai") {
    if (!count(usage.total_tokens, context + maxOutput) || usage.total_tokens !== usage.input_tokens + usage.output_tokens) return failed();
  } else {
    // No cache controls are sent. Unexpected cache accounting is not refunded.
    for (const key of ["cache_creation_input_tokens", "cache_read_input_tokens"]) {
      if (usage[key] !== undefined && usage[key] !== 0) return failed();
    }
  }
  // Conservative verified-usage upper bound; includes reasoning output and counts
  // all OpenAI input at cache-write/long-context maximum, never at cached discount.
  const cost = provider === "openai"
    ? Math.ceil((usage.input_tokens * 5 + usage.output_tokens * 18) / 10)
    : Math.ceil((usage.input_tokens + usage.output_tokens * 5) / 2);
  if (!count(cost, QUOTE)) return failed();
  return { ok: true, text, actualCostMicroUSD: cost };
}

export async function invokeBackup(request: {
  provider: BackupProvider;
  input: string;
  signal: AbortSignal;
  maxOutputTokens: number;
  reservation: BackupReservation;
  apiKey: string;
  enabled?: boolean;
}, injectedFetch: typeof fetch = fetch, now = Date.now()): Promise<BackupOutcome> {
  const quote = quoteFor(request.provider, now);
  const receipt = request.reservation;
  if (request.enabled !== true || !quote || typeof request.input !== "string" || !request.input.trim() || bytes(request.input) > MAX_INPUT_BYTES ||
      !count(request.maxOutputTokens, MAX_OUTPUT_TOKENS) || request.maxOutputTokens < 1 ||
      typeof request.apiKey !== "string" || !request.apiKey.trim() || /[\r\n]/.test(request.apiKey) ||
      !receipt || !uuid.test(receipt.id) || !uuid.test(receipt.fence) || receipt.ceiling !== quote.maxCostMicroUSD ||
      usedReceipts.has(receipt) || !request.signal || request.signal.aborted) return failed(400);
  usedReceipts.add(receipt);
  const isOpenAI = request.provider === "openai";
  const url = isOpenAI ? "https://api.openai.com/v1/responses" : "https://api.anthropic.com/v1/messages";
  const headers: Record<string, string> = { "content-type": "application/json", "authorization": `Bearer ${request.apiKey}` };
  if (!isOpenAI) headers["anthropic-version"] = "2026-10-21";
  const body = isOpenAI
    ? { model: quote.model, input: request.input, max_output_tokens: request.maxOutputTokens, reasoning: { effort: "none" }, store: false, stream: false, service_tier: "default" }
    : { model: quote.model, messages: [{ role: "user", content: request.input }], max_tokens: request.maxOutputTokens, stream: false, thinking: { type: "adaptive" } };
  try {
    const response = await injectedFetch(url, { method: "POST", headers, body: JSON.stringify(body), redirect: "error", cache: "no-store", signal: AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]) });
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      // Never read upstream error body, infer zero balance, or claim no billing.
      return failed(response.status);
    }
    return parseResolved(request.provider, await readBoundedJSON(response), request.maxOutputTokens);
  } catch {
    // Includes timeout/abort, response read failure and uncertain remote outcome.
    return failed();
  }
}
