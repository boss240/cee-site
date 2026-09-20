import { and, desc, eq, inArray } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateWithModels } from "@/lib/ai-factory";
import { listNews } from "./rss";

export type DigestRow = typeof schema.digests.$inferSelect;

export type DigestKind = "energy" | "local";

export async function listPublishedDigests(limit = 50, kind?: DigestKind): Promise<DigestRow[]> {
  try {
    const conds = [eq(schema.digests.published, true)];
    if (kind) conds.push(eq(schema.digests.kind, kind));
    return await db.select().from(schema.digests).where(and(...conds)).orderBy(desc(schema.digests.publishedAt), desc(schema.digests.createdAt)).limit(limit);
  } catch {
    return [];
  }
}

export async function getDigest(slug: string, publishedOnly = true): Promise<DigestRow | null> {
  try {
    const conds = [eq(schema.digests.slug, slug)];
    if (publishedOnly) conds.push(eq(schema.digests.published, true));
    const [d] = await db.select().from(schema.digests).where(and(...conds)).limit(1);
    return d ?? null;
  } catch {
    return null;
  }
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
}

const CATEGORY_TITLES: Record<string, string> = {
  regulator: "Регулятор",
  government: "Уряд і законодавство",
  operator: "Оператор системи",
  market: "Ринок",
  media: "Галузеві медіа",
  local: "Місцеві новини",
};

/**
 * Чернетка дайджесту за період. Якщо є робоча AI-модель — просить її
 * згрупувати й прокоментувати новини; якщо ні — збирає структурований
 * список за категоріями джерел. У будь-якому разі кожен пункт має посилання
 * на першоджерело, а публікує чернетку лише адміністратор.
 */
export async function buildDigestDraft(opts: { from: Date; to: Date; unassignedOnly?: boolean; kind?: DigestKind }) {
  const kind: DigestKind = opts.kind ?? "energy";
  const news = await listNews({ from: opts.from, to: opts.to, limit: 120, unassignedOnly: opts.unassignedOnly ?? true, kind });
  const title = kind === "local"
    ? `Місцеві новини Ладижина і громади: ${fmtDate(opts.from)} — ${fmtDate(opts.to)}`
    : `Дайджест енергетики: ${fmtDate(opts.from)} — ${fmtDate(opts.to)}`;
  const slug = `${kind === "local" ? "mistsevi-novyny" : "daidzhest"}-${opts.from.toISOString().slice(0, 10)}-${opts.to.toISOString().slice(0, 10)}`;

  if (news.length === 0) {
    return { title, slug, kind, intro: "", body: "", newsIds: [] as number[], mode: "empty" as const };
  }

  // Табличний (шаблонний) варіант — завжди готовий
  const byCat = new Map<string, typeof news>();
  for (const n of news) {
    const k = n.sourceCategory ?? "media";
    byCat.set(k, [...(byCat.get(k) ?? []), n]);
  }
  const templateBody = [...byCat.entries()]
    .map(([cat, items]) => {
      const lines = items.map((n) => {
        const date = n.publishedAt ? new Date(n.publishedAt).toLocaleDateString("uk-UA") : "";
        const s = n.summary ? ` — ${n.summary.slice(0, 220)}${n.summary.length > 220 ? "…" : ""}` : "";
        return `- **[${n.title}](${n.url})** (${n.sourceName}${date ? `, ${date}` : ""})${s}`;
      });
      return `## ${CATEGORY_TITLES[cat] ?? cat}\n\n${lines.join("\n")}`;
    })
    .join("\n\n");

  const ai = await generateWithModels({
    locale: "uk",
    page: "admin/digests",
    maxTokens: 2500,
    system: kind === "local"
      ? `Ти редактор місцевого дайджесту Центру енергоефективності (ЦЕЕ, Ладижин). Аудиторія: мешканці Ладижина і громади, ОСББ, місцевий бізнес, комунальні підприємства.
Напиши дайджест українською у Markdown за наданими новинами. Правила:
- Групуй за темами (енергетика й комунальні послуги, рішення міської ради, програми підтримки, інфраструктура, інше). Пропускай порожні теми.
- Кожен пункт: коротка суть (1–2 речення) + посилання на першоджерело у форматі [назва](url). Не вигадуй фактів і цифр, яких нема в новині.
- Після кожної теми додай 1 речення «Що це означає для мешканців» — практичний висновок, обережно, без гарантій.
- Не додавай заголовок першого рівня і не пиши вступ — тільки розділи ## і пункти.`
      : `Ти редактор дайджесту Центру енергоефективності (ЦЕЕ, Ладижин). Аудиторія: громади, ОСББ, бізнес, девелопери ВДЕ/BESS, донори.
Напиши дайджест українською у Markdown за наданими новинами. Правила:
- Групуй за темами (регулювання й тарифи, законодавство, програми підтримки, мережі та ринок, ВДЕ/накопичувачі, інше). Пропускай порожні теми.
- Кожен пункт: коротка суть (1–2 речення) + посилання на першоджерело у форматі [назва](url). Не вигадуй фактів і цифр, яких нема в новині.
- Після кожної теми додай 1 речення «Що це означає для вас» — практичний висновок для аудиторії, обережно, без гарантій.
- Не додавай заголовок першого рівня і не пиши вступ — тільки розділи ## і пункти.`,
    prompt: news
      .map((n) => `- ${n.title}\n  джерело: ${n.sourceName}; дата: ${n.publishedAt ? new Date(n.publishedAt).toISOString().slice(0, 10) : "?"}; url: ${n.url}\n  анотація: ${(n.summary ?? "").slice(0, 400)}`)
      .join("\n"),
  });

  const intro = `${kind === "local" ? "Огляд місцевих новин Ладижина і громади" : "Огляд змін в енергетиці України"} за період ${fmtDate(opts.from)} — ${fmtDate(opts.to)}: ${news.length} ${news.length === 1 ? "публікація" : news.length < 5 ? "публікації" : "публікацій"} з ${byCat.size} ${byCat.size === 1 ? "категорії" : "категорій"} джерел. Відібрано та перевірено фахівцем ЦЕЕ.`;

  return {
    title,
    slug,
    kind,
    intro,
    body: ai?.text?.trim() ? ai.text.trim() : templateBody,
    newsIds: news.map((n) => n.id),
    mode: ai ? ("ai" as const) : ("template" as const),
  };
}

/** Прив'язати новини до збереженого дайджесту (щоб не потрапили в наступний) */
export async function assignNewsToDigest(digestId: number, newsIds: number[]) {
  if (!newsIds.length) return;
  await db.update(schema.newsItems).set({ digestId }).where(inArray(schema.newsItems.id, newsIds));
}
