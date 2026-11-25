/**
 * Публічний Telegram-канал ЦЕЕ. Задається змінною NEXT_PUBLIC_TELEGRAM_CHANNEL_URL
 * (наприклад https://t.me/cee_ladyzhyn). Поки змінну не задано або вона некоректна,
 * сайт не показує жодних посилань на Telegram.
 */
const TELEGRAM_URL = /^https:\/\/t\.me\/[A-Za-z0-9_]{5,32}\/?$/;

export function ceeTelegramUrl(raw: string | undefined = process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL): string | null {
  const value = raw?.trim();
  return value && TELEGRAM_URL.test(value) ? value.replace(/\/$/, "") : null;
}

/**
 * Публічний чат каналу для публікацій: TELEGRAM_CHANNEL_ID (@назва або -100…),
 * інакше — @назва з NEXT_PUBLIC_TELEGRAM_CHANNEL_URL.
 */
export function ceeChannelChatId(env: Record<string, string | undefined> = {
  TELEGRAM_CHANNEL_ID: process.env.TELEGRAM_CHANNEL_ID,
  NEXT_PUBLIC_TELEGRAM_CHANNEL_URL: process.env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL,
}): string | null {
  const explicit = env.TELEGRAM_CHANNEL_ID?.trim();
  if (explicit) return /^@[A-Za-z0-9_]{5,32}$|^-100\d{5,20}$/.test(explicit) ? explicit : null;
  const url = ceeTelegramUrl(env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL);
  return url ? "@" + url.slice(url.lastIndexOf("/") + 1) : null;
}
