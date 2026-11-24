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
