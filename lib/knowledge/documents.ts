import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";

export type DocRow = typeof schema.documents.$inferSelect;

export const DOC_KINDS = ["law", "resolution", "regulator", "dbn", "dstu", "iso", "eu", "other"] as const;
export type DocKind = (typeof DOC_KINDS)[number];

/** Повнотекстовий пошук по назві, номеру, анотації і тегах (конфігурація 'simple' — без стемінгу, але працює з українською) */
export async function searchDocuments(opts: { q?: string; kind?: string; limit?: number; publishedOnly?: boolean }) {
  const { q, kind, limit = 50, publishedOnly = true } = opts;
  const conds = [];
  if (publishedOnly) conds.push(eq(schema.documents.published, true));
  if (kind && (DOC_KINDS as readonly string[]).includes(kind)) conds.push(eq(schema.documents.kind, kind));
  const query = q?.trim();
  if (query) {
    const like = `%${query.replace(/[%_]/g, "")}%`;
    // Префіксний tsquery: «накопич» знайде «накопичувач», «накопичення»
    const prefix = query
      .split(/[^\p{L}\p{N}]+/u)
      .filter((w) => w.length >= 2)
      .slice(0, 8)
      .map((w) => `${w.replace(/[':&|!()<>\\]/g, "")}:*`)
      .join(" & ");
    const tsv = sql`to_tsvector('simple', coalesce(${schema.documents.title},'') || ' ' || coalesce(${schema.documents.number},'') || ' ' || coalesce(${schema.documents.summary},'') || ' ' || coalesce(${schema.documents.tags}::text,'') || ' ' || coalesce(${schema.documents.keyPoints}::text,''))`;
    conds.push(
      sql`(${tsv} @@ plainto_tsquery('simple', ${query})
           ${prefix ? sql`or ${tsv} @@ to_tsquery('simple', ${prefix})` : sql``}
           or ${schema.documents.title} ilike ${like} or ${schema.documents.number} ilike ${like} or ${schema.documents.tags}::text ilike ${like} or ${schema.documents.summary} ilike ${like})`
    );
  }
  try {
    return await db
      .select()
      .from(schema.documents)
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(schema.documents.checkedAt), desc(schema.documents.updatedAt))
      .limit(limit);
  } catch {
    return [];
  }
}

export async function getDocument(slug: string, publishedOnly = true): Promise<{ doc: DocRow; updates: (typeof schema.documentUpdates.$inferSelect)[] } | null> {
  try {
    const conds = [eq(schema.documents.slug, slug)];
    if (publishedOnly) conds.push(eq(schema.documents.published, true));
    const [doc] = await db.select().from(schema.documents).where(and(...conds)).limit(1);
    if (!doc) return null;
    const updates = await db.select().from(schema.documentUpdates).where(eq(schema.documentUpdates.documentId, doc.id)).orderBy(desc(schema.documentUpdates.date));
    return { doc, updates };
  } catch {
    return null;
  }
}

const STOP = new Set(["який", "яка", "яке", "які", "яких", "якщо", "щоб", "або", "також", "того", "цього", "може", "можна", "можуть", "потрібно", "потрібна", "потрібен", "треба", "буде", "було", "бути", "після", "перед", "через", "коли", "куди", "тому", "чому", "дуже", "лише", "тільки", "what", "which", "does", "need", "have", "with", "that", "this", "from", "about", "there"]);

/** Ключові слова питання: довші за 3 літери, без службових; закінчення обрізаємо до префікса */
function keywords(text: string) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4 && !STOP.has(w))
    .map((w) => (w.length > 6 ? w.slice(0, Math.max(5, Math.min(7, w.length - 2))) : w)) // «накопичення» → «накопич» (знайде і «накопичувач»), «ліцензія» → «ліценз»
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 10);
}

/**
 * Для AI-консультації: найрелевантніші документи за БУДЬ-ЯКИМ із ключових
 * слів питання, впорядковані за ts_rank. Спершу — точний пошук (усі слова),
 * якщо мало — OR-пошук за префіксами.
 */
export async function retrieveForAsk(question: string, limit = 6): Promise<DocRow[]> {
  const primary = await searchDocuments({ q: question, limit });
  if (primary.length >= 3) return primary;
  const kws = keywords(question);
  if (kws.length === 0) return primary;
  const safe = kws.map((w) => `${w.replace(/[':&|!()<>\\]/g, "")}:*`);
  const orQuery = safe.join(" | ");
  const tsv = sql`to_tsvector('simple', coalesce(${schema.documents.title},'') || ' ' || coalesce(${schema.documents.summary},'') || ' ' || coalesce(${schema.documents.tags}::text,'') || ' ' || coalesce(${schema.documents.keyPoints}::text,''))`;
  try {
    const alt = await db
      .select()
      .from(schema.documents)
      .where(and(eq(schema.documents.published, true), sql`${tsv} @@ to_tsquery('simple', ${orQuery})`))
      // Спершу — документи, що покривають більше РІЗНИХ ключових слів (щоб «енергія» не переважала «ліцензія»+«накопичувач»), потім ts_rank
      .orderBy(
        sql`(${sql.join(safe.map((w) => sql`(${tsv} @@ to_tsquery('simple', ${w}))::int`), sql` + `)}) desc`,
        sql`ts_rank(${tsv}, to_tsquery('simple', ${orQuery})) desc`
      )
      .limit(limit);
    const seen = new Set(primary.map((d) => d.id));
    return [...primary, ...alt.filter((d) => !seen.has(d.id))].slice(0, limit);
  } catch {
    return primary;
  }
}
