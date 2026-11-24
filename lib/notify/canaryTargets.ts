import { createHash } from "node:crypto";
import { normalizedRecipient } from "./canaryRecipient";
export function singleTelegramTarget(env: Record<string, string | undefined>) {
  const values = (env.TELEGRAM_CHAT_ID ?? "").split(",").map(v => v.trim()).filter(Boolean);
  if (!env.TELEGRAM_BOT_TOKEN || values.length !== 1 || ! /^-?[1-9]\d{0,15}$/.test(values[0]) || !Number.isSafeInteger(Number(values[0]))) return null;
  // Mutable @usernames are not sufficient identity for a preflight-to-send binding.
  const recipient = normalizedRecipient("telegram", values[0])!;
  // Nonsecret identity reference, not an authorization credential. Changes to bot
  // credentials or configured destination invalidate the preflight selection.
  const reference = "configured:" + createHash("sha256").update(JSON.stringify([env.TELEGRAM_BOT_TOKEN, recipient])).digest("hex");
  return { recipient, reference };
}
