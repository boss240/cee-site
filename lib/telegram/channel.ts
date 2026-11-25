import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { siteOrigin } from "@/lib/siteUrl";
import { ceeChannelChatId, ceeTelegramUrl } from "@/lib/telegram";

/**
 * Публікації матеріалів сайту в публічний Telegram-канал ЦЕЕ.
 *
 * Змінні середовища:
 *   TELEGRAM_CHANNEL_BOT_TOKEN — токен окремого бота ЦЕЕ (адмін каналу з правом публікації);
 *   TELEGRAM_CHANNEL_ID        — необов'язково: @назва або -100…; інакше береться з NEXT_PUBLIC_TELEGRAM_CHANNEL_URL;
 *   CEE_TELEGRAM_AUTOPUBLISH   — "true": нові статті й дайджести йдуть у канал одразу після публікації на сайті.
 *
 * Правила: токен ніде не показується і не логується; канал не може збігатися з чатом заявок
 * (TELEGRAM_CHAT_ID); кожен матеріал публікується щонайбільше один раз (таблиця telegram_channel_posts).
 */

export type ChannelKind = "post" | "digest";
export type ChannelState = "ready" | "no_channel" | "no_token" | "conflict";
export type ChannelConfig = { state: ChannelState; chatId: string | null; channelUrl: string | null; autopublish: boolean };

const norm = (v: string) => v.trim().toLowerCase();

export function channelConfig(env: NodeJS.ProcessEnv = process.env): ChannelConfig {
  const chatId = ceeChannelChatId({ TELEGRAM_CHANNEL_ID: env.TELEGRAM_CHANNEL_ID, NEXT_PUBLIC_TELEGRAM_CHANNEL_URL: env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL });
  const channelUrl = ceeTelegramUrl(env.NEXT_PUBLIC_TELEGRAM_CHANNEL_URL);
  const autopublish = env.CEE_TELEGRAM_AUTOPUBLISH === "true";
  if (!chatId) return { state: "no_channel", chatId, channelUrl, autopublish };
  const leadChats = (env.TELEGRAM_CHAT_ID ?? "").split(",").map(norm).filter(Boolean);
  if (leadChats.includes(norm(chatId))) return { state: "conflict", chatId, channelUrl, autopublish };
  if (!env.TELEGRAM_CHANNEL_BOT_TOKEN?.trim()) return { state: "no_token", chatId, channelUrl, autopublish };
  return { state: "ready", chatId, channelUrl, autopublish };
}

type Item = { kind: ChannelKind; id: number; title: string; summary: string; path: string };

function plain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function shorten(text: string, max = 400): string {
  const t = plain(text);
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "));
  if (sentence > max * 0.5) return cut.slice(0, sentence + 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), max * 0.6)).trimEnd() + "…";
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildChannelText(item: Pick<Item, "title" | "summary" | "path">, origin: string): { text: string; url: string } {
  const url = new URL(item.path, origin).toString();
  const summary = shorten(item.summary);
  const text = `<b>${esc(item.title)}</b>${summary ? `\n\n${esc(summary)}` : ""}\n\n<a href="${esc(url)}">Читати на сайті →</a>`;
  return { text, url };
}

async function loadItem(kind: ChannelKind, id: number): Promise<Item | null> {
  if (kind === "post") {
    const [p] = await db.select().from(schema.posts).where(eq(schema.posts.id, id)).limit(1);
    if (!p || !p.published) return null;
    return { kind, id, title: p.titleUk, summary: p.excerptUk || p.bodyUk, path: `/uk/blog/${p.slug}` };
  }
  const [d] = await db.select().from(schema.digests).where(eq(schema.digests.id, id)).limit(1);
  if (!d || !d.published) return null;
  return { kind, id, title: d.title, summary: d.intro || d.body, path: `/uk/knowledge/digests/${d.slug}` };
}

const isMissingTable = (e: unknown) => {
  const err = e as { code?: string; cause?: { code?: string }; message?: string };
  return err?.code === "42P01" || err?.cause?.code === "42P01" || /telegram_channel_posts.*does not exist/i.test(err?.message ?? "");
};

export type ChannelRecord = { status: string; attempts: number; updatedAt: string; errorCode: string | null };

async function readRecord(kind: ChannelKind, id: number): Promise<ChannelRecord | null | "table_missing"> {
  try {
    const [r] = await db.select().from(schema.telegramChannelPosts)
      .where(and(eq(schema.telegramChannelPosts.kind, kind), eq(schema.telegramChannelPosts.itemId, id))).limit(1);
    return r ? { status: r.status, attempts: r.attempts, updatedAt: r.updatedAt.toISOString(), errorCode: r.errorCode } : null;
  } catch (e) {
    if (isMissingTable(e)) return "table_missing";
    throw e;
  }
}

export type PreviewResult =
  | { ok: true; config: ChannelConfig; text: string; url: string; record: ChannelRecord | null; tableReady: boolean }
  | { ok: false; code: "not_published" | "invalid_site_origin" };

/** Як виглядатиме допис. Нічого не надсилає. */
export async function previewChannelPost(kind: ChannelKind, id: number): Promise<PreviewResult> {
  const item = await loadItem(kind, id);
  if (!item) return { ok: false, code: "not_published" };
  let origin: string;
  try { origin = siteOrigin(); } catch { return { ok: false, code: "invalid_site_origin" }; }
  const { text, url } = buildChannelText(item, origin);
  const record = await readRecord(kind, id);
  return { ok: true, config: channelConfig(), text, url, record: record === "table_missing" ? null : record, tableReady: record !== "table_missing" };
}

export type PublishCode =
  | "sent" | "not_published" | "invalid_site_origin" | "already_posted" | "table_missing"
  | ChannelState | "telegram_rejected" | "telegram_unreachable";

/** Публікує один матеріал. Повторно той самий матеріал не шле: дозволено лише після явної помилки Telegram. */
export async function publishToChannel(kind: ChannelKind, id: number): Promise<{ ok: boolean; code: PublishCode }> {
  const config = channelConfig();
  if (config.state !== "ready" || !config.chatId) return { ok: false, code: config.state };
  const item = await loadItem(kind, id);
  if (!item) return { ok: false, code: "not_published" };
  let origin: string;
  try { origin = siteOrigin(); } catch { return { ok: false, code: "invalid_site_origin" }; }
  const { text } = buildChannelText(item, origin);

  let claimed: { id: number } | undefined;
  try {
    const res = await db.execute(sql`
      INSERT INTO "telegram_channel_posts" ("kind", "item_id", "status", "attempts")
      VALUES (${kind}, ${id}, 'sending', 1)
      ON CONFLICT ("kind", "item_id") DO UPDATE
        SET "status" = 'sending', "attempts" = "telegram_channel_posts"."attempts" + 1, "error_code" = NULL, "updated_at" = now()
        WHERE "telegram_channel_posts"."status" = 'failed'
      RETURNING "id"`);
    claimed = (res.rows as { id: number }[])[0];
  } catch (e) {
    if (isMissingTable(e)) return { ok: false, code: "table_missing" };
    throw e;
  }
  if (!claimed) return { ok: false, code: "already_posted" };

  const finish = (status: "sent" | "failed" | "uncertain", errorCode: string | null, messageId: number | null = null) =>
    db.update(schema.telegramChannelPosts)
      .set({ status, errorCode, messageId, updatedAt: new Date() })
      .where(eq(schema.telegramChannelPosts.id, claimed!.id));

  try {
    const response = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_CHANNEL_BOT_TOKEN!.trim()}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: config.chatId, text, parse_mode: "HTML" }),
      signal: AbortSignal.timeout(10_000),
    });
    const body = (await response.json().catch(() => null)) as { ok?: boolean; result?: { message_id?: number }; error_code?: number } | null;
    if (response.ok && body?.ok === true) {
      await finish("sent", null, typeof body.result?.message_id === "number" ? body.result.message_id : null);
      return { ok: true, code: "sent" };
    }
    const status = typeof body?.error_code === "number" ? body.error_code : response.status;
    await finish("failed", `telegram_${status}`);
    return { ok: false, code: "telegram_rejected" };
  } catch {
    // Відповіді не дочекались: допис міг вийти. Не повторюємо автоматично — спершу перевірте канал.
    await finish("uncertain", "no_response");
    return { ok: false, code: "telegram_unreachable" };
  }
}

/** Для автопублікації після першої публікації на сайті. Ніколи не кидає помилок у запит адміністратора. */
export async function autoPublish(kind: ChannelKind, id: number): Promise<void> {
  if (!channelConfig().autopublish) return;
  try {
    const r = await publishToChannel(kind, id);
    console.info(JSON.stringify({ event: "telegram_channel_autopublish", kind, id, code: r.code }));
  } catch {
    console.info(JSON.stringify({ event: "telegram_channel_autopublish", kind, id, code: "error" }));
  }
}

export type ChannelStatus = {
  config: ChannelConfig;
  tableReady: boolean;
  sent: number;
  problems: number;
  lastSentAt: string | null;
};

export async function readChannelStatus(): Promise<ChannelStatus> {
  const config = channelConfig();
  try {
    const rows = await db.select({ status: schema.telegramChannelPosts.status, count: sql<number>`count(*)::int` })
      .from(schema.telegramChannelPosts).groupBy(schema.telegramChannelPosts.status);
    const [last] = await db.select({ at: schema.telegramChannelPosts.updatedAt }).from(schema.telegramChannelPosts)
      .where(eq(schema.telegramChannelPosts.status, "sent")).orderBy(desc(schema.telegramChannelPosts.updatedAt)).limit(1);
    const by = (s: string) => rows.find((r) => r.status === s)?.count ?? 0;
    return { config, tableReady: true, sent: by("sent"), problems: by("failed") + by("uncertain"), lastSentAt: last?.at.toISOString() ?? null };
  } catch (e) {
    if (isMissingTable(e)) return { config, tableReady: false, sent: 0, problems: 0, lastSentAt: null };
    throw e;
  }
}
