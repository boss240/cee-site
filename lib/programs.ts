/**
 * Дані про програми фінансування.
 *
 * ТИМЧАСОВО в коді. На наступному етапі переїжджають у таблицю БД (Prisma/Postgres),
 * щоб контент оновлювала людина, а не розробник.
 *
 * ПРАВИЛО: жоден запис не публікується без заповнених `source` і `checkedAt`.
 * Запис, не перевірений понад 60 днів, показує позначку про застарілість.
 */

export type ProgramStatus = "active" | "paused" | "unknown";

export type Program = {
  id: string;
  name: string;
  administrator: string;
  status: ProgramStatus;
  statusNote?: string;
  summary: string;
  covers: string[];
  amount: string;
  cofinancing?: string;
  requirements: string[];
  contacts: { label: string; value: string; href?: string }[];
  source: string;
  checkedAt: string; // ISO
};

type Locale = "uk" | "en";

const PROGRAMS: Record<Locale, Program[]> = {
  uk: [
    {
      id: "grindim",
      name: "ГРІНДІМ",
      administrator: "Фонд енергоефективності",
      status: "active",
      summary:
        "Підтримка встановлення обладнання для власного виробництва, зберігання та ефективного використання електроенергії.",
      covers: [
        "Сонячні електростанції (СЕС) на дахах",
        "Установки зберігання енергії (УЗЕ) — акумуляторні системи",
        "Теплові насоси замість електричного чи газового опалення",
        "Системи керування енергоспоживанням",
      ],
      amount: "Часткова компенсація вартості обладнання",
      cofinancing: "Решту вносить ОСББ — власними або кредитними коштами",
      requirements: [
        "Рішення зборів співвласників",
        "Технічні умови на приєднання від оператора мережі",
        "Розрахунок потрібної потужності за фактичним профілем споживання",
      ],
      contacts: [
        { label: "Сайт", value: "eefund.org.ua", href: "https://eefund.org.ua" },
        { label: "Гаряча лінія", value: "0 800 215 790", href: "tel:0800215790" },
      ],
      source: "https://eefund.org.ua",
      checkedAt: "2026-08-29",
    },
    {
      id: "credits",
      name: "Банківські кредити на енергоефективність",
      administrator: "Банки-партнери державних програм",
      status: "active",
      summary:
        "Цільові кредити для ОСББ на енергетичне обладнання та модернізацію інженерних систем.",
      covers: [
        "СЕС та установки зберігання енергії",
        "Обладнання систем опалення, теплові насоси",
        "Роботи з термомодернізації",
        "Співфінансування грантової частини інших програм",
      ],
      amount: "Ставки та ліміти встановлює конкретний банк",
      cofinancing:
        "Кредит можна поєднувати з грантом: грант покриває основну частину, кредит — внесок ОСББ",
      requirements: [
        "Рішення зборів співвласників про залучення кредиту",
        "Фінансова звітність ОСББ",
        "Кошторис робіт",
        "Документи про реєстрацію об'єднання",
      ],
      contacts: [
        { label: "Умови", value: "Уточнюються безпосередньо в банку" },
      ],
      source: "Умови програм публікують банки-учасники",
      checkedAt: "2026-08-29",
    },
    {
      id: "energodim",
      name: "ЕНЕРГОДІМ",
      administrator: "Фонд енергоефективності",
      status: "paused",
      statusNote:
        "Приймання нових заявок зупинено 22 серпня 2026 через переформатування програми під вимоги EU Ukraine Facility. Орієнтовне відновлення — жовтень 2026. Дату варто уточнювати у Фонді.",
      summary:
        "Грантова підтримка комплексної термомодернізації багатоквартирних будинків.",
      covers: [
        "Утеплення покрівлі, фасаду, цоколю",
        "Модернізація системи опалення, встановлення ІТП",
        "Заміна вікон і дверей у місцях спільного користування",
        "Інженерні системи: вентиляція, водопостачання",
      ],
      amount: "До 70% вартості робіт",
      cofinancing: "ОСББ вносить решту — від 30%",
      requirements: [
        "ОСББ зареєстроване, має чинне правління",
        "Немає заборгованості перед бюджетом",
        "Проведено збори співвласників із рішенням про участь",
        "Підготовлено проєктну документацію та кошторис",
      ],
      contacts: [
        { label: "Сайт", value: "eefund.org.ua", href: "https://eefund.org.ua" },
        { label: "Гаряча лінія", value: "0 800 215 790", href: "tel:0800215790" },
        { label: "Телефон", value: "+38 044 222-95-90", href: "tel:+380442229590" },
        { label: "Пошта", value: "support@eefund.org.ua", href: "mailto:support@eefund.org.ua" },
        { label: "Адреса", value: "Київ, вул. Ділова, 24" },
      ],
      source: "https://eefund.org.ua",
      checkedAt: "2026-08-29",
    },
  ],
  en: [
    {
      id: "grindim",
      name: "GRINDIM",
      administrator: "Energy Efficiency Fund",
      status: "active",
      summary:
        "Support for installing equipment for own generation, storage, and efficient use of electricity.",
      covers: [
        "Rooftop solar power plants",
        "Battery energy storage systems",
        "Heat pumps replacing electric or gas heating",
        "Energy consumption management systems",
      ],
      amount: "Partial compensation of equipment cost",
      cofinancing: "The HOA covers the rest — from own or borrowed funds",
      requirements: [
        "Co-owners' meeting decision",
        "Grid connection technical conditions from the network operator",
        "Required capacity calculation based on the actual consumption profile",
      ],
      contacts: [
        { label: "Website", value: "eefund.org.ua", href: "https://eefund.org.ua" },
        { label: "Hotline", value: "0 800 215 790", href: "tel:0800215790" },
      ],
      source: "https://eefund.org.ua",
      checkedAt: "2026-08-29",
    },
    {
      id: "credits",
      name: "Bank loans for energy efficiency",
      administrator: "Banks partnering with state programs",
      status: "active",
      summary:
        "Targeted loans for HOAs for energy equipment and engineering system upgrades.",
      covers: [
        "Solar power and battery storage systems",
        "Heating system equipment, heat pumps",
        "Thermal modernization works",
        "Co-financing the grant portion of other programs",
      ],
      amount: "Rates and limits are set by the specific bank",
      cofinancing:
        "A loan can be combined with a grant: the grant covers the main part, the loan covers the HOA's contribution",
      requirements: [
        "Co-owners' meeting decision to take out a loan",
        "HOA financial statements",
        "Cost estimate for the works",
        "Association registration documents",
      ],
      contacts: [
        { label: "Terms", value: "Confirm directly with the bank" },
      ],
      source: "Program terms are published by participating banks",
      checkedAt: "2026-08-29",
    },
    {
      id: "energodim",
      name: "ENERGODIM",
      administrator: "Energy Efficiency Fund",
      status: "paused",
      statusNote:
        "New applications have been suspended since August 22, 2026 while the program is reformatted to meet EU Ukraine Facility requirements. Expected resumption — October 2026. Confirm the date with the Fund.",
      summary:
        "Grant support for comprehensive thermal modernization of apartment buildings.",
      covers: [
        "Roof, facade and basement insulation",
        "Heating system upgrade, ITP installation",
        "Replacement of windows and doors in common areas",
        "Engineering systems: ventilation, water supply",
      ],
      amount: "Up to 70% of the cost of works",
      cofinancing: "The HOA covers the rest — from 30%",
      requirements: [
        "The HOA is registered and has an active board",
        "No outstanding debt to the budget",
        "A co-owners' meeting has been held with a decision to participate",
        "Design documentation and cost estimate prepared",
      ],
      contacts: [
        { label: "Website", value: "eefund.org.ua", href: "https://eefund.org.ua" },
        { label: "Hotline", value: "0 800 215 790", href: "tel:0800215790" },
        { label: "Phone", value: "+38 044 222-95-90", href: "tel:+380442229590" },
        { label: "Email", value: "support@eefund.org.ua", href: "mailto:support@eefund.org.ua" },
        { label: "Address", value: "24 Dilova St., Kyiv" },
      ],
      source: "https://eefund.org.ua",
      checkedAt: "2026-08-29",
    },
  ],
};

export function getPrograms(locale: Locale): Program[] {
  return PROGRAMS[locale] ?? PROGRAMS.uk;
}

export const STATUS_LABEL: Record<Locale, Record<ProgramStatus, string>> = {
  uk: {
    active: "Приймає заявки",
    paused: "Приймання зупинено",
    unknown: "Статус уточнюється",
  },
  en: {
    active: "Accepting applications",
    paused: "Applications suspended",
    unknown: "Status pending confirmation",
  },
};
