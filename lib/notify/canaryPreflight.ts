import { normalizedRecipient } from "./canaryRecipient";
import { singleTelegramTarget } from "./canaryTargets";
const headers = { "Cache-Control": "private, no-store" };
type Dependencies = { authorize: () => Promise<boolean>; origin: () => string; env: Record<string, string | undefined>; fetch: typeof fetch };
async function boundedJSON(response: Response) {
  if (!response.body) throw new Error("missing_body");
  const reader = response.body.getReader(); const decoder = new TextDecoder("utf-8", { fatal: true });
  let text = "", bytes = 0;
  try { for (;;) { const part = await reader.read(); if (part.done) break;
    bytes += part.value.byteLength; if (bytes > 16_384) throw new Error("response_limit");
    text += decoder.decode(part.value, { stream: true });
  } text += decoder.decode(); return JSON.parse(text); }
  finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}
/** Membership and metadata only. No message sends/history, DB writes or configuration changes. */
export async function notificationPreflight(request: Request, deps: Dependencies): Promise<Response> {
  const reply = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers });
  try {
    if (request.method !== "POST") return reply({ status: "denied" }, 405);
    if (!await deps.authorize()) return reply({ status: "denied" }, 401);
    if (request.headers.get("origin") !== deps.origin() || request.headers.get("sec-fetch-site") === "cross-site") return reply({ status: "denied" }, 403);
    if (new URL(request.url).search || request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase() !== "application/json" || !request.body) return reply({ status: "invalid_request" }, 400);
    const reader = request.body.getReader(); let bytes = 0, text = "", expired = false;
    const decoder = new TextDecoder("utf-8", { fatal: true });
    const timer = setTimeout(() => { expired = true; void reader.cancel().catch(() => {}); }, 2_000);
    try { for (;;) { const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength; if (bytes > 512) return reply({ status: "invalid_request" }, 413);
      text += decoder.decode(part.value, { stream: true });
    } text += decoder.decode(); }
    finally { clearTimeout(timer); await reader.cancel().catch(() => {}); reader.releaseLock(); }
    if (expired || request.signal.aborted) return reply({ status: "invalid_request" }, 400);
    let data: unknown; try { data = JSON.parse(text); } catch { return reply({ status: "invalid_request" }, 400); }
    if (!data || typeof data !== "object" || Array.isArray(data)) return reply({ status: "invalid_request" }, 400);
    const d = data as Record<string, unknown>;
    if (d.channel === "email") {
      if (Object.keys(d).sort().join(",") !== "channel,recipient" || typeof d.recipient !== "string") return reply({ status: "invalid_request" }, 400);
      const recipient = normalizedRecipient("email", d.recipient);
      const matched = !!recipient && (deps.env.NOTIFY_TO ?? "").split(",").some(v => normalizedRecipient("email", v) === recipient);
      return reply({ channel: "email", status: matched ? "matched" : "not_matched" });
    }
    if (d.channel !== "telegram" || Object.keys(d).join(",") !== "channel") return reply({ status: "invalid_request" }, 400);
    const count = (deps.env.TELEGRAM_CHAT_ID ?? "").split(",").map(v => v.trim()).filter(Boolean).length;
    if (count > 1) return reply({ channel: "telegram", status: "multiple_destinations" });
    const target = singleTelegramTarget(deps.env);
    if (!target) return reply({ channel: "telegram", status: "unconfigured" });
    const signal = AbortSignal.any([request.signal, AbortSignal.timeout(10_000)]);
    const call = async (method: "getMe" | "getChat", body: Record<string, string>) => {
      const response = await deps.fetch(`https://api.telegram.org/bot${deps.env.TELEGRAM_BOT_TOKEN}/${method}`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
        signal, redirect: "error", cache: "no-store",
      });
      if (!response.ok) { await response.body?.cancel().catch(() => {}); throw new Error("provider_failed"); }
      const value = await boundedJSON(response);
      if (!value || value.ok !== true || !value.result || typeof value.result !== "object") throw new Error("invalid_reply");
      return value.result;
    };
    const bot = await call("getMe", {});
    if (bot.is_bot !== true || typeof bot.username !== "string" || bot.username.toLowerCase() !== "cee_ladyzhyn_bot") return reply({ channel: "telegram", status: "bot_mismatch" });
    const chat = await call("getChat", { chat_id: target.recipient });
    if (!Number.isSafeInteger(chat.id) || String(chat.id) !== target.recipient || !["private", "group", "supergroup", "channel"].includes(chat.type)) throw new Error("invalid_chat");
    const displayName = typeof chat.title === "string" ? chat.title : [chat.first_name, chat.last_name].filter(v => typeof v === "string").join(" ");
    if (!displayName || displayName.length > 256) throw new Error("invalid_chat");
    return reply({ channel: "telegram", status: "matched", botUsername: "@cee_ladyzhyn_bot", chatDisplayName: displayName,
      chatType: chat.type, maskedChatId: String(chat.id).length > 4 ? "…" + String(chat.id).slice(-4) : "…", targetReference: target.reference });
  } catch { return reply({ status: "unknown" }, 502); }
}
