import { generateWithModels } from "@/lib/ai-factory";
import { retrieveForAsk, type DocRow } from "./documents";
import { draftKnowledgeCandidate } from "./autoDraft";

export type AskCitation = { slug: string; title: string; number: string | null; kind: string };
export type AskAnswer = {
  answer: string; // Markdown
  citations: AskCitation[];
  mode: "ai" | "retrieval";
};

const KIND_LABEL: Record<string, string> = {
  law: "Закон", resolution: "Постанова КМУ", regulator: "Постанова НКРЕКП", dbn: "ДБН", dstu: "ДСТУ", iso: "ISO", eu: "Акт ЄС", other: "Документ",
};

function docContext(d: DocRow) {
  const kp = Array.isArray(d.keyPoints) ? (d.keyPoints as string[]).map((k) => `  • ${k}`).join("\n") : "";
  return `### [${d.slug}] ${KIND_LABEL[d.kind] ?? d.kind} ${d.number ?? ""} — ${d.title}\nВидавник: ${d.issuer ?? "—"}; статус: ${d.status}; перевірено: ${d.checkedAt ? new Date(d.checkedAt).toISOString().slice(0, 10) : "—"}\n${d.summary.slice(0, 1800)}\n${kp}`;
}

/**
 * Консультація по законодавству: знаходить релевантні документи у базі ЦЕЕ,
 * відповідає лише на їх основі (з посиланнями на картки), а без AI-ключа
 * чесно показує знайдені документи без «згенерованої» відповіді.
 */
export async function answerQuestion(question: string, locale: "uk" | "en"): Promise<AskAnswer> {
  const docs = await retrieveForAsk(question, 6);
  const citations: AskCitation[] = docs.map((d) => ({ slug: d.slug, title: d.title, number: d.number, kind: d.kind }));

  if (docs.length === 0) {
    // Прогалина в базі: жодного документа ЦЕЕ за цим питанням. Не чекаємо
    // на відповідь (не блокуємо й не сповільнюємо користувача) — паралельно
    // просимо AI підготувати чернетку майбутньої статті на перевірку
    // фахівцю. Так база документів поповнюється сама з реальних питань
    // відвідувачів, а не тільки вручну.
    void draftKnowledgeCandidate(question, locale).catch(() => {});
    return {
      mode: "retrieval",
      citations: [],
      answer:
        locale === "en"
          ? "We did not find a document in the CEE knowledge base that matches this question. Try different wording (law number, subject, keyword), browse the documents catalogue, or ask a specialist through the contact form."
          : "У базі ЦЕЕ не знайшлося документа, який відповідає цьому питанню. Спробуйте інше формулювання (номер закону, предмет, ключове слово), перегляньте каталог документів або поставте питання фахівцю через форму заявки.",
    };
  }

  const ai = await generateWithModels({
    locale,
    page: "knowledge/ask",
    maxTokens: 1200,
    system: `Ти консультант Центру енергоефективності (ЦЕЕ) з енергетичного законодавства України. Відповідай ${locale === "en" ? "англійською" : "українською"} у Markdown.
Правила:
- Спирайся ТІЛЬКИ на надані витяги з документів. Якщо у витягах немає відповіді — так і скажи, і порадь, куди дивитися (первинне джерело, фахівець ЦЕЕ).
- Коли посилаєшся на документ, вказуй його ідентифікатор у квадратних дужках, як у витягу: наприклад [zakon-2019-viii]. Ідентифікатор пиши точно.
- Не вигадуй номери статей, дати, тарифи чи цифри, яких нема у витягах.
- Структура: коротка відповідь (2–4 речення), далі «Що це означає на практиці» (2–4 пункти), далі «Джерела» — перелік ідентифікаторів.
- Це інформаційна довідка, не юридичний висновок; наприкінці одним реченням порадь підтвердити деталі за первинним джерелом або у фахівця ЦЕЕ.`,
    prompt: `ПИТАННЯ:\n${question}\n\nВИТЯГИ З БАЗИ ДОКУМЕНТІВ ЦЕЕ:\n\n${docs.map(docContext).join("\n\n")}`,
  });

  if (ai?.text?.trim()) {
    return { mode: "ai", citations, answer: ai.text.trim() };
  }

  // Без AI: чесна відповідь — знайдені документи з ключовими положеннями
  const lines = docs.map((d) => {
    const kp = Array.isArray(d.keyPoints) ? (d.keyPoints as string[]).slice(0, 3).map((k) => `  - ${k}`).join("\n") : "";
    return `**${KIND_LABEL[d.kind] ?? d.kind} ${d.number ?? ""} — ${d.title}** [${d.slug}]\n${kp}`;
  });
  const head =
    locale === "en"
      ? "AI drafting is not enabled on this site yet, so here are the documents from the CEE base that match your question, with their key points:"
      : "AI-формулювання відповіді на сайті ще не увімкнено, тому нижче — документи з бази ЦЕЕ, що стосуються вашого питання, з ключовими положеннями:";
  const tail =
    locale === "en"
      ? "Open a document card for the summary, the change log and the link to the primary source. For a project-specific answer, contact a CEE specialist."
      : "Відкрийте картку документа — там анотація, журнал змін і посилання на первинне джерело. Для відповіді щодо вашого конкретного об'єкта — зверніться до фахівця ЦЕЕ.";
  return { mode: "retrieval", citations, answer: `${head}\n\n${lines.join("\n\n")}\n\n${tail}` };
}
