/**
 * Сповіщення в Telegram без залежностей — через Bot API.
 *
 * Змінні середовища (.env.local):
 *   TELEGRAM_BOT_TOKEN — токен бота від @BotFather
 *   TELEGRAM_CHAT_ID   — id чату або групи, куди писати (можна кілька через кому)
 */
export function isTelegramConfigured() {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID);
}

export async function sendTelegram(html: string) {
  if (!isTelegramConfigured()) return { skipped: true as const };
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const chats = process.env.TELEGRAM_CHAT_ID!.split(",").map((s) => s.trim()).filter(Boolean);

  const results = await Promise.all(
    chats.map(async (chat_id) => {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id, text: html, parse_mode: "HTML", disable_web_page_preview: true }),
        signal: AbortSignal.timeout(10_000),
      });
      return res.ok;
    })
  );
  return { skipped: false as const, sent: results.filter(Boolean).length, total: results.length };
}
