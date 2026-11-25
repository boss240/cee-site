"use client";

import { useState } from "react";
import { Loader2, Send, X } from "lucide-react";

type Kind = "post" | "digest";
type Preview =
  | { ok: true; text: string; url: string; config: { state: string; chatId: string | null; autopublish: boolean }; record: { status: string; updatedAt: string } | null; tableReady: boolean }
  | { ok: false; code: string };

const COPY = {
  uk: {
    open: "Опублікувати в Telegram", title: "Допис у Telegram-канал", channel: "Канал", cancel: "Скасувати", publish: "Опублікувати",
    loading: "Готую попередній перегляд…", sent: "Опубліковано в каналі.", link: "Посилання на сайт",
    already: "Цей матеріал уже опубліковано в каналі", uncertain: "Telegram не відповів під час минулої спроби — допис міг вийти. Перевірте канал; повторно не надсилаємо.",
    states: {
      no_channel: "Канал не задано (NEXT_PUBLIC_TELEGRAM_CHANNEL_URL).",
      no_token: "Бот каналу не підключено: додайте TELEGRAM_CHANNEL_BOT_TOKEN у налаштуваннях Vercel.",
      conflict: "Канал збігається з чатом заявок (TELEGRAM_CHAT_ID) — публікацію заблоковано, щоб контакти людей не потрапили в публічний канал.",
      table_missing: "Таблицю публікацій ще не створено (міграція 0008_telegram_channel_posts).",
      not_published: "Спершу опублікуйте матеріал на сайті.",
      invalid_site_origin: "Не задано публічну адресу сайту (NEXT_PUBLIC_APP_URL).",
      already_posted: "Цей матеріал уже опубліковано в каналі.",
      telegram_rejected: "Telegram відхилив допис. Перевірте, що бот — адміністратор каналу з правом публікації.",
      telegram_unreachable: "Telegram не відповів. Допис міг вийти — перевірте канал, перш ніж пробувати знову.",
      error: "Не вдалося. Спробуйте пізніше.",
    } as Record<string, string>,
  },
  en: {
    open: "Publish to Telegram", title: "Telegram channel post", channel: "Channel", cancel: "Cancel", publish: "Publish",
    loading: "Preparing preview…", sent: "Published to the channel.", link: "Link to the site",
    already: "This item has already been posted to the channel", uncertain: "Telegram did not respond last time — the post may have gone out. Check the channel; we do not resend.",
    states: {
      no_channel: "No channel set (NEXT_PUBLIC_TELEGRAM_CHANNEL_URL).",
      no_token: "Channel bot not connected: add TELEGRAM_CHANNEL_BOT_TOKEN in Vercel settings.",
      conflict: "The channel equals the leads chat (TELEGRAM_CHAT_ID) — publishing is blocked so contact details never reach a public channel.",
      table_missing: "The posts table is not created yet (migration 0008_telegram_channel_posts).",
      not_published: "Publish the item on the site first.",
      invalid_site_origin: "Public site address (NEXT_PUBLIC_APP_URL) is not set.",
      already_posted: "This item has already been posted to the channel.",
      telegram_rejected: "Telegram rejected the post. Make sure the bot is a channel admin allowed to post.",
      telegram_unreachable: "Telegram did not respond. The post may have gone out — check the channel before retrying.",
      error: "Failed. Try again later.",
    } as Record<string, string>,
  },
};

/** Кнопка в рядку опублікованого матеріалу: попередній перегляд → підтвердження → публікація. */
export function TelegramPublishButton({ kind, id, className }: { kind: Kind; id: number; className?: string }) {
  const lang = typeof document !== "undefined" && document.documentElement.lang === "en" ? "en" : "uk";
  const t = COPY[lang];
  const [open, setOpen] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; code: string } | null>(null);

  async function show() {
    setOpen(true); setPreview(null); setResult(null);
    const r = await fetch(`/api/admin/telegram-channel?kind=${kind}&id=${id}`).catch(() => null);
    setPreview(r?.ok ? await r.json() : { ok: false, code: "error" });
  }

  async function publish() {
    setBusy(true);
    const r = await fetch("/api/admin/telegram-channel", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, id }) }).catch(() => null);
    const body = r ? await r.json().catch(() => null) : null;
    setResult(body && typeof body.code === "string" ? body : { ok: false, code: "error" });
    setBusy(false);
  }

  const blockedReason = preview && preview.ok
    ? (!preview.tableReady ? "table_missing" : preview.config.state !== "ready" ? preview.config.state : null)
    : null;
  const posted = preview && preview.ok && preview.record && preview.record.status !== "failed" ? preview.record : null;

  return (
    <>
      <button type="button" onClick={show} aria-label={t.open} title={t.open} className={className}>
        <Send size={16} aria-hidden />
      </button>
      {open && (
        <div role="dialog" aria-modal="true" aria-label={t.title} className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-semibold">{t.title}</h2>
              <button type="button" onClick={() => setOpen(false)} aria-label={t.cancel} className="rounded p-1 hover:bg-[var(--color-surface)]"><X size={18} aria-hidden /></button>
            </div>
            {!preview ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-[var(--color-fg-muted)]"><Loader2 size={16} className="animate-spin" aria-hidden /> {t.loading}</p>
            ) : !preview.ok ? (
              <p role="alert" className="mt-4 text-sm">{t.states[preview.code] ?? t.states.error}</p>
            ) : (
              <>
                {preview.config.chatId && <p className="mt-2 text-xs text-[var(--color-fg-placeholder)]">{t.channel}: {preview.config.chatId}</p>}
                <div className="mt-4 whitespace-pre-wrap rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-4 text-sm"
                  dangerouslySetInnerHTML={{ __html: preview.text.replace(/<a href="([^"]+)">/g, '<a href="$1" target="_blank" rel="noreferrer" class="underline">') }} />
                {posted && <p role="status" className="mt-3 text-sm">{posted.status === "uncertain" ? t.uncertain : `${t.already} (${posted.updatedAt.slice(0, 16).replace("T", " ")}).`}</p>}
                {blockedReason && <p role="alert" className="mt-3 text-sm">{t.states[blockedReason] ?? t.states.error}</p>}
                {result && <p role="status" className={`mt-3 text-sm ${result.ok ? "text-[var(--color-brand-text)]" : ""}`}>{result.ok ? t.sent : t.states[result.code] ?? t.states.error}</p>}
                <div className="mt-5 flex gap-3">
                  <button type="button" onClick={publish} disabled={busy || !!blockedReason || !!posted || !!result?.ok}
                    className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-brand)] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[var(--color-brand-hover)] disabled:opacity-50">
                    {busy ? <Loader2 size={16} className="animate-spin" aria-hidden /> : <Send size={16} aria-hidden />} {t.publish}
                  </button>
                  <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-[var(--color-line)] px-4 py-2 text-sm font-medium">{t.cancel}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
