/**
 * Сповіщення в Telegram без залежностей — через Bot API.
 *
 * Змінні середовища (.env.local):
 *   TELEGRAM_BOT_TOKEN — токен бота від @BotFather
 *   TELEGRAM_CHAT_ID   — id чату або групи, куди писати (можна кілька через кому)
 */
/** Публічний канал ЦЕЕ — ніколи не адресат заявок (там контакти людей). */
function isPublicChannel(chat: string): boolean {
  const norm = (v: string) => v.trim().toLowerCase();
  const url = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL?.trim();
  const fromUrl = url && /^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}\/?$/.test(url) ? "@" + url.replace(/\/$/, "").split("/").pop() : "";
  const blocked = [process.env.TELEGRAM_CHANNEL_ID ?? "", fromUrl].map(norm).filter(Boolean);
  return blocked.includes(norm(chat));
}

export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegram(html: string) {
  if (!isTelegramConfigured()) return { skipped: true as const };
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chats = process.env.TELEGRAM_CHAT_ID!.split(",").map((s) => s.trim()).filter(Boolean).filter((c) => !isPublicChannel(c));

  const results = await Promise.all(
    chats.map(async (chat_id) => {
      try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10_000),
      });
      const body = await res.json().catch(() => null);
      return res.ok && body?.ok === true;
      } catch { return false; }
    })
  );
  return { skipped: false as const, sent: results.filter(Boolean).length, total: results.length };
}
