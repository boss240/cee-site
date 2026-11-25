import { readChannelStatus } from "@/lib/telegram/channel";

const COPY = {
  uk: {
    title: "Telegram-канал ЦЕЕ", channel: "Канал", auto: "Автопублікація нових статей і дайджестів", on: "увімкнено", off: "вимкнено",
    sent: "Опубліковано дописів", problems: "Потребують перевірки", last: "Останній допис", none: "—",
    ready: "Підключено: бот може публікувати в канал.",
    states: {
      no_channel: "Канал не задано: додайте NEXT_PUBLIC_TELEGRAM_CHANNEL_URL.",
      no_token: "Бот каналу не підключено: додайте TELEGRAM_CHANNEL_BOT_TOKEN (токен окремого бота ЦЕЕ від @BotFather) у Vercel.",
      conflict: "Канал збігається з чатом заявок (TELEGRAM_CHAT_ID). Публікацію заблоковано, щоб контакти людей не потрапили в публічний канал.",
    } as Record<string, string>,
    table: "Таблицю публікацій ще не створено (міграція 0008_telegram_channel_posts) — публікація недоступна.",
    how: "Опублікувати вручну: кнопка зі значком літачка біля опублікованої статті чи дайджесту. Кожен матеріал іде в канал лише раз. Токен бота тут не показується.",
  },
  en: {
    title: "CEE Telegram channel", channel: "Channel", auto: "Auto-publish new articles and digests", on: "on", off: "off",
    sent: "Posts published", problems: "Need checking", last: "Last post", none: "—",
    ready: "Connected: the bot can post to the channel.",
    states: {
      no_channel: "No channel set: add NEXT_PUBLIC_TELEGRAM_CHANNEL_URL.",
      no_token: "Channel bot not connected: add TELEGRAM_CHANNEL_BOT_TOKEN (a dedicated CEE bot from @BotFather) in Vercel.",
      conflict: "The channel equals the leads chat (TELEGRAM_CHAT_ID). Publishing is blocked so contact details never reach a public channel.",
    } as Record<string, string>,
    table: "The posts table is not created yet (migration 0008_telegram_channel_posts) — publishing is unavailable.",
    how: "Publish manually with the paper-plane button next to a published article or digest. Each item goes to the channel only once. The bot token is never shown here.",
  },
};

export async function TelegramChannelCard({ locale }: { locale: string }) {
  const t = locale === "en" ? COPY.en : COPY.uk;
  const s = await readChannelStatus().catch(() => null);
  if (!s) return null;
  const c = s.config;
  return (
    <section className="rounded-lg border p-4" aria-labelledby="tg-channel-title">
      <h2 id="tg-channel-title" className="font-semibold">{t.title}</h2>
      <p role="status" className="mt-2 text-sm">{c.state === "ready" ? t.ready : t.states[c.state]}</p>
      {!s.tableReady && <p className="mt-2 text-sm">{t.table}</p>}
      <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
        <div><dt className="text-[var(--color-fg-muted)]">{t.channel}</dt><dd className="mt-1 font-semibold">{c.channelUrl ? <a href={c.channelUrl} target="_blank" rel="noreferrer" className="underline">{c.chatId}</a> : c.chatId ?? t.none}</dd></div>
        <div><dt className="text-[var(--color-fg-muted)]">{t.auto}</dt><dd className="mt-1 font-semibold">{c.autopublish ? t.on : t.off}</dd></div>
        <div><dt className="text-[var(--color-fg-muted)]">{t.sent}</dt><dd className="mt-1 font-semibold">{s.sent}{s.problems ? ` · ${t.problems}: ${s.problems}` : ""}</dd></div>
        <div><dt className="text-[var(--color-fg-muted)]">{t.last}</dt><dd className="mt-1 font-semibold">{s.lastSentAt ? s.lastSentAt.slice(0, 16).replace("T", " ") : t.none}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-[var(--color-fg-muted)]">{t.how}</p>
    </section>
  );
}
