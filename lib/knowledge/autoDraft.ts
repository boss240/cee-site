import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { generateWithModels } from "@/lib/ai-factory";

const UK_MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z",
  и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p",
  р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ь: "", ю: "iu", я: "ia", "'": "", "ʼ": "",
};

function slugifyQuestion(q: string): string {
  const base = q
    .toLowerCase()
    .split("")
    .map((c) => UK_MAP[c] ?? c)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
  return `draft-${base || "zapyt"}`.slice(0, 160);
}

function extractTags(q: string): string[] {
  return q
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length >= 4)
    .filter((w, i, arr) => arr.indexOf(w) === i)
    .slice(0, 8);
}

/**
 * Самонавчання бази знань: викликається з lib/knowledge/ask.ts коли за
 * питанням відвідувача НЕ знайшлось жодного документа в "documents" —
 * тобто це реальна прогалина, а не помилка пошуку. Замість мовчазного
 * "не знайдено" просимо AI дослідити питання загально (без прив'язки до
 * конкретного документа ЦЕЕ, бо такого ще нема) і зберігаємо результат як
 * НЕОПУБЛІКОВАНУ чернетку (aiDraft=true, published=false, status="draft").
 * Фахівець бачить її в адмінці → «Документи» і перевіряє/публікує сам —
 * жодна чернетка не потрапляє відвідувачам без ручної перевірки: цифри,
 * номери законів і тарифи від AI без джерела можуть бути помилковими.
 *
 * Викликається fire-and-forget (без await у виклику) — не сповільнює
 * відповідь користувачу і не ламає її, якщо генерація чернетки впаде.
 */
export async function draftKnowledgeCandidate(question: string, locale: "uk" | "en"): Promise<void> {
  const trimmed = question.trim();
  if (trimmed.length < 8) return; // занадто коротке — не варте чернетки

  const slug = slugifyQuestion(trimmed);

  // Не дублюємо: те саме (за словами) питання вже ставили — чернетка з
  // таким slug вже є, другий виклик AI не потрібен.
  const existing = await db
    .select({ id: schema.documents.id })
    .from(schema.documents)
    .where(eq(schema.documents.slug, slug))
    .limit(1);
  if (existing.length > 0) return;

  const ai = await generateWithModels({
    locale,
    page: "knowledge/auto-draft",
    maxTokens: 900,
    timeoutMs: 30000,
    system: `Ти — дослідник нормативної бази для Центру енергоефективності (ЦЕЕ, Ладижин, Україна). Тобі дають питання відвідувача сайту, на яке в базі документів ЦЕЕ ще немає відповіді. Підготуй ЧЕРНЕТКУ майбутньої статті бази знань, яку потім перевірить і опублікує фахівець — це не публічна відповідь, тому можна прямо позначати невпевненість. Пиши ${locale === "en" ? "англійською" : "українською"}.

Правила:
- Стисла, фактологічна відповідь по суті (енергоефективність, законодавство, тарифи, програми підтримки в Україні).
- Якщо не впевнений у конкретній цифрі, номері статті чи даті — напиши "уточнити" замість вигаданого значення. Ніколи не вигадуй номери законів.
- Формат відповіді, без markdown-заголовків:
Рядок 1: коротка назва теми (до 100 символів).
Порожній рядок, далі 2-4 речення суті.
Порожній рядок, далі до 5 пунктів, кожен з нового рядка починається з "- ".`,
    prompt: `ПИТАННЯ ВІДВІДУВАЧА:\n${trimmed}`,
  });

  const text = ai?.text?.trim();
  if (!text) return; // немає доступних AI-моделей — просто не створюємо чернетку

  const lines = text.split("\n").map((l) => l.trim());
  const title = (lines[0] || trimmed).slice(0, 200);
  const kpStart = lines.findIndex((l) => /^-\s/.test(l));
  const keyPoints =
    kpStart >= 0
      ? lines
          .slice(kpStart)
          .filter((l) => l.startsWith("-"))
          .map((l) => l.replace(/^-\s*/, "").trim())
          .filter(Boolean)
          .slice(0, 5)
      : [];
  const summary = (kpStart >= 0 ? lines.slice(1, kpStart) : lines.slice(1)).join("\n").trim() || text;

  try {
    await db.insert(schema.documents).values({
      slug,
      kind: "other",
      title: `[Чернетка] ${title}`,
      status: "draft",
      summary,
      keyPoints,
      tags: extractTags(trimmed),
      published: false,
      aiDraft: true,
      draftQuestion: trimmed,
    });
  } catch {
    // Гонка (два ідентичні запити одночасно) чи інша помилка вставки —
    // чернетка не критична для роботи сайту, просто пропускаємо.
  }
}
