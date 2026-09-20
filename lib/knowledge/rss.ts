import Parser from "rss-parser";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type SourceRow = typeof schema.sources.$inferSelect;

const parser = new Parser({
  timeout: 15000,
  headers: { "User-Agent": "CEE-Digest/1.0 (+https://cee.org.ua)" },
});

export type FetchResult = { ok: boolean; status: string; added: number; total: number };

/**
 * Забирає стрічку одного джерела, кладе нові записи в news_items.
 * Дублікати визначаються за URL (unique), тож повторний запуск безпечний.
 */
export async function fetchSource(source: SourceRow, opts: { dryRun?: boolean } = {}): Promise<FetchResult> {
  let feed: Awaited<ReturnType<typeof parser.parseURL>>;
  try {
    feed = await parser.parseURL(source.url);
  } catch (e) {
    const status = `error: ${(e instanceof Error ? e.message : String(e)).slice(0, 180)}`;
    if (!opts.dryRun) {
      await db.update(schema.sources).set({ lastFetchedAt: new Date(), lastStatus: status }).where(eq(schema.sources.id, source.id));
    }
    return { ok: false, status, added: 0, total: 0 };
  }

  const items = (feed.items ?? []).filter((i) => i.link && i.title).slice(0, 60);
  if (opts.dryRun) {
    return { ok: true, status: `ok: ${items.length} items (${feed.title ?? ""})`, added: 0, total: items.length };
  }

  let added = 0;
  for (const it of items) {
    const publishedAt = it.isoDate ? new Date(it.isoDate) : it.pubDate ? new Date(it.pubDate) : null;
    const summary = (it.contentSnippet ?? it.summary ?? it.content ?? "").replace(/\s+/g, " ").trim().slice(0, 1200);
    try {
      const res = await db
        .insert(schema.newsItems)
        .values({
          sourceId: source.id,
          title: it.title!.trim().slice(0, 500),
          url: it.link!.trim().slice(0, 1000),
          publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
          summary: summary || null,
        })
        .onConflictDoNothing({ target: schema.newsItems.url })
        .returning({ id: schema.newsItems.id });
      if (res.length) added += 1;
    } catch {
      /* один поганий запис не зупиняє решту */
    }
  }
  const status = `ok: +${added} / ${items.length}`;
  await db.update(schema.sources).set({ lastFetchedAt: new Date(), lastStatus: status }).where(eq(schema.sources.id, source.id));
  return { ok: true, status, added, total: items.length };
}

/** Усі увімкнені джерела — для cron і кнопки «Оновити все» */
export async function fetchAllEnabled(): Promise<{ source: string; result: FetchResult }[]> {
  const list = await db.select().from(schema.sources).where(eq(schema.sources.enabled, true));
  const out: { source: string; result: FetchResult }[] = [];
  for (const s of list) {
    out.push({ source: s.name, result: await fetchSource(s) });
  }
  return out;
}

/** Новини за період (для чернетки дайджесту та адмінки) */
export async function listNews(opts: { from?: Date; to?: Date; limit?: number; unassignedOnly?: boolean; /** "local" — лише місцеві джерела; "energy" — усі, крім місцевих */ kind?: "energy" | "local" }) {
  const { from, to, limit = 200, unassignedOnly = false, kind } = opts;
  const conds = [sql`1=1`];
  if (kind === "local") conds.push(sql`${schema.sources.category} = 'local'`);
  if (kind === "energy") conds.push(sql`coalesce(${schema.sources.category}, 'media') <> 'local'`);
  if (from) conds.push(sql`coalesce(${schema.newsItems.publishedAt}, ${schema.newsItems.fetchedAt}) >= ${from}`);
  if (to) conds.push(sql`coalesce(${schema.newsItems.publishedAt}, ${schema.newsItems.fetchedAt}) <= ${to}`);
  if (unassignedOnly) conds.push(sql`${schema.newsItems.digestId} is null`);
  return db
    .select({
      id: schema.newsItems.id,
      title: schema.newsItems.title,
      url: schema.newsItems.url,
      publishedAt: schema.newsItems.publishedAt,
      fetchedAt: schema.newsItems.fetchedAt,
      summary: schema.newsItems.summary,
      digestId: schema.newsItems.digestId,
      sourceName: schema.sources.name,
      sourceCategory: schema.sources.category,
    })
    .from(schema.newsItems)
    .innerJoin(schema.sources, eq(schema.newsItems.sourceId, schema.sources.id))
    .where(sql.join(conds, sql` and `))
    .orderBy(sql`coalesce(${schema.newsItems.publishedAt}, ${schema.newsItems.fetchedAt}) desc`)
    .limit(limit);
}
