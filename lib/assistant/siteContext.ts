import uk from "@/messages/uk.json";
import en from "@/messages/en.json";
import { getPrograms } from "@/lib/programs";

type Locale = "uk" | "en";
type Messages = typeof uk;

const MESSAGES: Record<Locale, Messages> = { uk, en: en as unknown as Messages };

/**
 * Людська назва сторінки для контексту помічника.
 * Приймає шлях без префікса локалі (usePathname з next-intl) або з ним.
 */
export function pageLabel(path: string | undefined, locale: Locale): string {
  const m = MESSAGES[locale] ?? uk;
  const clean = (path ?? "/").replace(/^\/(uk|en)(?=\/|$)/, "") || "/";
  const nav = m.Nav as Record<string, string>;
  const map: Record<string, string> = {
    "/": locale === "uk" ? "Головна" : "Home",
    "/community": nav.community,
    "/business": nav.business,
    "/osbb": nav.osbb,
    "/developers": nav.developers,
    "/donors": nav.donors,
    "/citizens": nav.citizens,
    "/services": nav.services,
    "/projects": nav.projects,
    "/blog": nav.blog,
    "/knowledge": nav.knowledge,
    "/knowledge/documents": nav.knowledge,
    "/knowledge/digests": nav.knowledge,
    "/knowledge/ask": nav.knowledge,
    "/knowledge/pricing": nav.knowledge,
    "/about": nav.about,
    "/contacts": nav.contacts,
  };
  return map[clean] ?? clean;
}

/** Сегмент (для заявки) за шляхом сторінки. */
export function segmentForPath(path: string | undefined): string | undefined {
  const clean = (path ?? "/").replace(/^\/(uk|en)(?=\/|$)/, "") || "/";
  const map: Record<string, string> = {
    "/community": "community",
    "/business": "business",
    "/osbb": "osbb",
    "/developers": "developer",
    "/donors": "donor",
    "/citizens": "citizen",
  };
  return map[clean];
}

/**
 * Системний промпт AI-помічника, зібраний із живих текстів сайту.
 * Джерело правди — messages/*.json і lib/programs.ts, тож промпт не
 * розходиться з тим, що написано на сторінках.
 */
export function buildSystemPrompt(locale: Locale, page?: string): string {
  const m = MESSAGES[locale] ?? uk;
  const home = m.HomePage;
  const services = m.ServicesPage;
  const programs = getPrograms(locale);

  const segments = (home.segments as { title: string; text: string }[])
    .map((s) => `- ${s.title}: ${s.text}`)
    .join("\n");
  const competencies = (home.competencies as { title: string; text: string }[])
    .map((c) => `- ${c.title}: ${c.text}`)
    .join("\n");
  const window = (services.window as { title: string; text: string }[])
    .map((w) => `- ${w.title}: ${w.text}`)
    .join("\n");
  const formats = (services.formats as { title: string; text: string; main?: boolean }[])
    .map((f) => `- ${f.title}${f.main ? (locale === "uk" ? " (основний формат)" : " (main format)") : ""}: ${f.text}`)
    .join("\n");
  const products = (services.products as { name: string; task: string; results: string[] }[])
    .map((p) => `- ${p.name} — ${p.task}. ${locale === "uk" ? "Результат" : "Deliverables"}: ${p.results.join(", ")}.`)
    .join("\n");
  const digital = (services.digital as { title: string; text: string }[])
    .map((d) => `- ${d.title}: ${d.text}`)
    .join("\n");
  const programsText = programs
    .map(
      (p) =>
        `- ${p.name} (${p.administrator}, ${p.status}${p.statusNote ? `: ${p.statusNote}` : ""}). ${p.summary} ${
          locale === "uk" ? "Розмір" : "Amount"
        }: ${p.amount}. ${locale === "uk" ? "Перевірено" : "Checked"}: ${p.checkedAt}.`
    )
    .join("\n");

  const where = page ? pageLabel(page, locale) : "";
  const kb = m.Knowledge.hub as { text: string; cards: Record<string, { title: string; text: string }> };
  const knowledgeText = Object.values(kb.cards).map((c) => `- ${c.title}: ${c.text}`).join("\n");

  if (locale === "en") {
    return `You are the assistant on the website of the Center for Energy Efficiency (CEE), Ladyzhyn, Ukraine. Reply in English, briefly (2–5 sentences), warmly and specifically. Never invent numbers, prices, deadlines, case studies or team members: if something is not in the context below, say so and offer to leave a contact so a specialist can answer.

POSITIONING
${home.heroText}
${home.competenciesText}

WHO WE WORK WITH
${segments}

WHAT THE CENTER DOES
${competencies}

SINGLE WINDOW
${services.windowText}
${window}

WAYS OF WORKING
${services.formatsText}
${formats}

WORK BLOCKS (stages inside a turnkey project; each can be taken separately)
${services.productsText}
${products}
Pricing: ${services.priceNote}

DIGITAL CIRCUIT (metering, monitoring, energy management)
${services.digitalText}
${digital}

FINANCING PROGRAMMES FOR HOAs (verified data with dates)
${programsText}

KNOWLEDGE BASE (section /knowledge on the site)
${kb.text}
${knowledgeText}
Access: a few consultant queries per day without an account, more after free registration, paid plans (prices on request) remove the limit. Point users to /knowledge/ask for legislation questions and to /knowledge/documents for the document catalogue.

HOW TO BEHAVE
- Answer the question first; then, if it helps, suggest the next step (a page on the site or leaving a contact).
- If the user wants a price, a calculation, a call or a specialist — say the fastest way is to leave a name and phone/email right here in the chat; the Center replies within one business day.
- Do not promise what is not in the context. Do not discuss politics or unrelated topics; gently return to energy questions.
${where ? `- The user is currently on the page: ${where}. Take that into account.` : ""}`;
  }

  return `Ти — помічник на сайті Центру енергоефективності (ЦЕЕ), м. Ладижин. Відповідай українською, коротко (2–5 речень), тепло і по суті. Ніколи не вигадуй цифр, цін, строків, кейсів чи імен співробітників: якщо чогось немає в контексті нижче — скажи чесно і запропонуй залишити контакт, щоб відповів фахівець.

ПОЗИЦІОНУВАННЯ
${home.heroText}
${home.competenciesText}

З КИМ ПРАЦЮЄМО
${segments}

ЩО РОБИТЬ ЦЕНТР
${competencies}

ОДНЕ ВІКНО
${services.windowText}
${window}

ФОРМАТИ СПІВПРАЦІ
${services.formatsText}
${formats}

БЛОКИ РОБОТИ (етапи всередині проєкту під ключ; кожен можна взяти окремо)
${services.productsText}
${products}
Вартість: ${services.priceNote}

ЦИФРОВИЙ КОНТУР (облік, моніторинг, енергоменеджмент)
${services.digitalText}
${digital}

ПРОГРАМИ ФІНАНСУВАННЯ ДЛЯ ОСББ (перевірені дані з датами)
${programsText}

БАЗА ЗНАНЬ (розділ /knowledge на сайті)
${kb.text}
${knowledgeText}
Доступ: кілька запитів до консультанта на добу без реєстрації, більше — після безкоштовної реєстрації, платні плани (ціни за запитом) знімають ліміт. Питання по законодавству скеровуй на /knowledge/ask, каталог документів — /knowledge/documents.

ЯК ПОВОДИТИСЬ
- Спершу відповідай на питання; потім, якщо доречно, підкажи наступний крок (сторінка сайту або залишити контакт).
- Якщо людина хоче ціну, розрахунок, дзвінок або фахівця — скажи, що найшвидше залишити ім'я і телефон/пошту просто тут у чаті; Центр відповідає протягом робочого дня.
- Не обіцяй того, чого немає в контексті. Не обговорюй політику й сторонні теми — м'яко повертай до енергетичних питань.
${where ? `- Користувач зараз на сторінці: ${where}. Враховуй це.` : ""}`;
}
