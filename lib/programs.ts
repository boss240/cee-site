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
  "uk": [
    {
      "id": "grindim",
      "name": "ГрінДІМ",
      "administrator": "Фонд енергоефективності",
      "status": "paused",
      "statusNote": "На перевіреній сторінці Фонду приймання нових заявок призупинено. Дату відновлення не підтверджено.",
      "summary": "Грантова програма для енергетичних заходів у багатоквартирних будинках.",
      "covers": [
        "СЕС, теплові насоси, генератори та установки зберігання енергії"
      ],
      "amount": "Розмір відшкодування визначають чинні документи Фонду",
      "cofinancing": "Власний внесок і допустимі витрати уточнюються для конкретної заявки",
      "requirements": [
        "Перевірити відновлення приймання та вимоги Фонду"
      ],
      "contacts": [
        {
          "label": "Умови Фонду",
          "value": "Програма «ГрінДІМ»",
          "href": "https://eefund.org.ua/greendim/"
        }
      ],
      "source": "https://eefund.org.ua/greendim/",
      "checkedAt": "2026-10-22"
    },
    {
      "id": "credits",
      "name": "Енергопідтримка ОСББ та ЖБК",
      "administrator": "Фонд розвитку підприємництва; кредитори — банки-партнери програми",
      "status": "unknown",
      "statusNote": "Доступність кредиту й остаточні умови для заявника підтверджує обраний банк.",
      "summary": "Кредитна програма для обладнання спільного майна будинку.",
      "covers": [
        "Генератори, СЕС і теплові насоси"
      ],
      "amount": "До 3 млн грн; до 1 року — 0%, до 2 років — 5%, до 3 років — 7% річних",
      "cofinancing": "Компенсація та власний внесок залежать від обладнання й умов програми; суміщення з іншими грантами не гарантується",
      "requirements": [
        "Перевірка відповідності критеріям програми та рішення банку"
      ],
      "contacts": [
        {
          "label": "Банки та умови",
          "value": "Офіційна сторінка енергопідтримки ОСББ",
          "href": "https://energycredit.bdf.gov.ua/for-osbb/"
        }
      ],
      "source": "https://energycredit.bdf.gov.ua/for-osbb/",
      "checkedAt": "2026-10-22"
    },
    {
      "id": "energodim",
      "name": "Енергодім",
      "administrator": "Фонд енергоефективності",
      "status": "paused",
      "statusNote": "Фонд повідомляє про паузу для нових заявок із 22 квітня 2026 року. Підтвердженої дати відновлення на перевіреній сторінці немає.",
      "summary": "Підтримка термомодернізації багатоквартирних будинків.",
      "covers": [
        "Заходи енергоефективності за пакетами програми"
      ],
      "amount": "Частка відшкодування залежить від пакета та виду витрат",
      "cofinancing": "Внесок ОСББ визначають за погодженими витратами; універсальний відсоток не застосовується",
      "requirements": [
        "Перед підготовкою заявки звірити статус, пакет і документи з Фондом"
      ],
      "contacts": [
        {
          "label": "Умови Фонду",
          "value": "Програма «Енергодім»",
          "href": "https://eefund.org.ua/energodim/"
        }
      ],
      "source": "https://eefund.org.ua/energodim/",
      "checkedAt": "2026-10-22"
    }
  ],
  "en": [
    {
      "id": "grindim",
      "name": "GreenDIM",
      "administrator": "Energy Efficiency Fund",
      "status": "paused",
      "statusNote": "The reviewed Fund page says new applications are suspended. No reopening date has been confirmed.",
      "summary": "A grant programme for energy measures in apartment buildings.",
      "covers": [
        "Solar PV, heat pumps, generators and energy storage"
      ],
      "amount": "Reimbursement is governed by the Fund’s current programme documents",
      "cofinancing": "The applicant contribution and eligible costs must be checked for the specific application",
      "requirements": [
        "Check reopening and the Fund’s requirements"
      ],
      "contacts": [
        {
          "label": "Fund terms",
          "value": "GreenDIM programme",
          "href": "https://eefund.org.ua/greendim/"
        }
      ],
      "source": "https://eefund.org.ua/greendim/",
      "checkedAt": "2026-10-22"
    },
    {
      "id": "credits",
      "name": "Energy support for HOAs and housing cooperatives",
      "administrator": "Business Development Fund; lenders are programme partner banks",
      "status": "unknown",
      "statusNote": "The selected bank confirms loan availability and final terms for the applicant.",
      "summary": "A lending programme for equipment serving shared building property.",
      "covers": [
        "Generators, solar PV and heat pumps"
      ],
      "amount": "Up to UAH 3 million; up to 1 year — 0%, up to 2 years — 5%, up to 3 years — 7% annually",
      "cofinancing": "Compensation and the applicant contribution depend on equipment and programme terms; combining other grants is not guaranteed",
      "requirements": [
        "Programme eligibility assessment and the bank’s decision"
      ],
      "contacts": [
        {
          "label": "Banks and terms",
          "value": "Official HOA energy support page",
          "href": "https://energycredit.bdf.gov.ua/for-osbb/"
        }
      ],
      "source": "https://energycredit.bdf.gov.ua/for-osbb/",
      "checkedAt": "2026-10-22"
    },
    {
      "id": "energodim",
      "name": "EnergoDIM",
      "administrator": "Energy Efficiency Fund",
      "status": "paused",
      "statusNote": "The Fund reports a pause for new applications from 22 April 2026. The reviewed page provides no confirmed reopening date.",
      "summary": "Support for thermal modernisation of apartment buildings.",
      "covers": [
        "Energy efficiency measures under programme packages"
      ],
      "amount": "Reimbursement depends on the package and cost category",
      "cofinancing": "The HOA contribution is based on approved costs; there is no universal percentage",
      "requirements": [
        "Check application status, package and documents with the Fund before proceeding"
      ],
      "contacts": [
        {
          "label": "Fund terms",
          "value": "EnergoDIM programme",
          "href": "https://eefund.org.ua/energodim/"
        }
      ],
      "source": "https://eefund.org.ua/energodim/",
      "checkedAt": "2026-10-22"
    }
  ]
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
