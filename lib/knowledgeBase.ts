/**
 * База знань AI-помічника — режим без зовнішнього LLM.
 *
 * Це "RAG-lite": підбір відповіді локальним пошуком за ключовими словами.
 * Коли є ключ LLM, ці ж тексти сайту потрапляють у системний промпт
 * (lib/assistant/siteContext.ts), а локальна довідка явно позначається як негенеративна відповідь.
 *
 * Правило: відповіді не містять цифр, цін і строків, яких немає на сайті.
 */

export type KBEntry = {
  id: string;
  keywords: string[];
  answer: string;
};

type Locale = "uk" | "en";

const ENTRIES: Record<Locale, KBEntry[]> = {
  uk: [
    {"id": "wastewater", "keywords": ["водовідвед", "каналіза", "стічн", "очисн"], "answer": "Водовідведення — один із напрямів ЦЕЕ. Починаємо з вихідних даних про стоки, стан мереж і обладнання та обмеження об'єкта; далі порівнюємо технічні рішення, готуємо проєкт і супроводжуємо впровадження. Склад робіт, вимоги до очищення й показники результату погоджуємо для конкретного об'єкта — без вигаданих нормативів чи гарантованої економії."},
    {"id": "water", "keywords": ["вода", "води", "водопостач", "водозабезпеч", "питна вода", "водяний", "витоки води"], "answer": "ЦЕЕ працює з водопостачанням: аналізуємо облік і баланс води, витоки, тиск, режим роботи насосів та стан мереж. На цій основі визначаємо заходи, проєктні рішення й спосіб перевірки результату. Для оцінки потрібні доступні показники споживання, опис мережі та задача власника."},
    {"id": "heat", "keywords": ["теплопостач", "опалення", "котельн", "тепломереж", "тепловий пункт", "тепло"], "answer": "ЦЕЕ працює з теплопостачанням та опаленням: облік тепла, аналіз втрат, режими обладнання, мережі й регулювання. Починаємо з даних та обстеження, порівнюємо варіанти, проєктуємо й супроводжуємо реалізацію. Результат перевіряємо за погодженими показниками з урахуванням погоди та режиму використання об'єкта."},
    {"id": "electricity", "keywords": ["електри", "електро", "електропостач"], "answer": "Електрика — один із напрямів інженерії ЦЕЕ, поряд із теплом, водою та водовідведенням. Облік, оцінка й аналіз електроспоживання часто дають найшвидший старт для пошуку результату. Перевіряємо навантаження, потужність, мережі та режими роботи; СЕС і BESS розглядаємо як можливі рішення за даними об'єкта, а не як обов'язкову покупку."},
    {
      id: "pricing",
      keywords: ["вартість", "ціна", "скільки коштує", "оплата", "прайс", "бюджет", "дорого"],
      answer:
        "Типового цінника немає — обсяг залежить від стану об'єкта, наявних даних і того, наскільки глибоко заходимо: від разового експертного висновку до проєкту під ключ. Найшвидший шлях до цифри — залишити ім'я і телефон або пошту просто тут у чаті: фахівець подивиться на вашу ситуацію та уточнить наступні кроки.",
    },
    {
      id: "how-it-works",
      keywords: ["як це працює", "порядок дій", "етапи", "процес", "з чого почати", "як почати", "перший крок"],
      answer:
        "Починаємо з обстеження і вимірювання: профілі споживання ресурсів, стан обліку, мереж і обладнання, обмеження об’єкта. Далі розрахунок і моделювання, потім проєктне рішення — і впровадження під ключ: закупівля, підрядники-партнери, контроль робіт, перевірка результату за даними обліку. Ви маєте справу з одним вікном, а не з п'ятьма виконавцями.",
    },
    {
      id: "single-window",
      keywords: ["одне вікно", "під ключ", "підрядник", "самі робите", "хто виконує", "монтаж", "виконавці"],
      answer:
        "Доводимо до кінця самі або із залученням підрядників-партнерів — там, де потрібні руки. Експертна, технічна й технологічна роль лишається за Центром: ми ставимо вимоги, контролюємо виконання і приймаємо роботи. Проєкт закривається не папкою документів, а працюючою системою, ефект якої підтверджено даними обліку.",
    },
    {
      id: "manager",
      keywords: ["менеджер", "зв'язатися", "консультація", "телефон", "людина", "передзвон", "фахівець", "спеціаліст", "поговорити"],
      answer:
        "Найшвидше — залишити контакт просто тут: натисніть «Залишити контакт», вкажіть ім'я і телефон або пошту. Звернення передамо фахівцю Центру. Якщо зручніше — є форма на сторінці «Контакти».",
    },
    {
      id: "support",
      keywords: ["підтримка", "технічна", "проблема", "не працює", "зламалось", "поломка"],
      answer:
        "Із технічних питань щодо вже встановленого обладнання опишіть, будь ласка, що саме і коли перестало працювати — і залиште контакт. Якщо система впроваджувалась через Центр, ми знаємо її склад і зможемо підказати швидше.",
    },
    {
      id: "osbb-programs",
      keywords: ["осбб", "програма", "грант", "кредит", "фінансування", "гріндім", "енергодім", "5-7-9", "компенсація", "співвласник"],
      answer:
        "Для ОСББ на сторінці «ОСББ» є інформація про підготовку проєктів. Ця локальна довідка не перевіряє актуальність програм фінансування: чинні умови та доступність коштів потрібно уточнювати в адміністратора відповідної програми. Типовий шлях: зняти профіль споживання, перевірити потужність приєднання, провести збори співвласників, підготувати документи, обрати джерело фінансування, подати заявку. Із усім цим Центр допомагає.",
    },
    {
      id: "ses-bess",
      keywords: ["сес", "узе", "накопичувач", "сонячна", "батарея", "акумулятор", "bess", "панелі", "генерація"],
      answer:
        "СЕС — власна генерація електроенергії на даху. Накопичувач (УЗЕ / BESS) запасає надлишок генерації або енергію за нічним тарифом і тримає критичне навантаження під час відключень. Потужність підбираємо під фактичний профіль споживання, а не під площу даху — тому починаємо з вимірювання.",
    },
    {
      id: "developers",
      keywords: ["девелопер", "приєднання", "оср", "технічні умови", "інвестор", "фінмодель", "фінансова модель", "мвт", "проєкт вде"],
      answer:
        "Для девелоперів ВДЕ і BESS Центр — місток між інвестицією і майданчиком: аналіз технічних умов і ризиків приєднання, пакет для взаємодії з ОСР, технічне завдання, фінансова модель зі сценаріями, контроль якості робіт. Три речі, за які відповідаємо: якість, адаптивність під фактичні обмеження і реалістичність — якщо проєкт не злітає, кажемо це на етапі аналізу.",
    },
    {
      id: "donors",
      keywords: ["донор", "нго", "громадська організація", "проєктний пакет", "заявка на грант", "логіка впливу", "звітність", "консорціум"],
      answer:
        "Для донорів, НГО та інвесторів готуємо доказовий проєктний пакет: проєктна ідея, бюджет, логіка впливу, комплект матеріалів для подачі — і тримаємо технічний супровід реалізації на місці, з контролем виконавців і підтвердженням результату за даними обліку. Ми знаємо громаду, тому пакет збігається з реальністю об'єктів, а не тільки з формою заявки.",
    },
    {
      id: "digital",
      keywords: ["облік", "лічильник", "моніторинг", "онлайн", "дашборд", "додаток", "енергоменеджмент", "iso 50001", "контроль споживання", "аналітика"],
      answer:
        "Цифровий контур — це те, що лишається на об'єкті після проєкту: сучасний облік із погодинним профілем, онлайн-відстеження споживання й генерації зі сповіщеннями, аналітика для керівника або зборів, застосунки під конкретний об'єкт і енергоменеджмент як постійний процес. Якщо цього немає — організовуємо; якщо є, але не працює — переробляємо.",
    },
    {
      id: "formats",
      keywords: ["формат", "абонент", "разова", "висновок", "супровід", "партнерство", "співпраця", "як працюємо"],
      answer:
        "П'ять форматів: разова консультація або експертний висновок, абонентське обслуговування, проєктний супровід одного етапу, проєкт під ключ (основний формат) і стратегічне партнерство чи консорціум. Формат обираємо під задачу — можна почати з перевірки ідеї й далі заходити глибше.",
    },
    {
      id: "citizens",
      keywords: ["приватний будинок", "власник", "дім", "дах", "мій будинок", "для себе", "домашня"],
      answer:
        "Для приватного будинку робимо те саме, що й для великих об'єктів, лише в меншому масштабі: аналізуємо електрику, опалення, водопостачання й водовідведення та погоджуємо пріоритети. СЕС і накопичувач розглядаємо за потребою та даними об’єкта. Якщо вам уже щось запропонували підрядники — можемо дати експертну думку до того, як ви заплатите.",
    },
    {
      id: "documents",
      keywords: ["документи", "які потрібні", "папери", "довідки", "протокол", "перелік"],
      answer:
        "Перелік залежить від напряму та програми. Для ОСББ типово: рішення зборів співвласників, технічні умови на приєднання, кошторис, фінансова звітність і документи про реєстрацію об'єднання. Для девелоперів — технічні умови, вихідні дані майданчика, вимоги інвестора. Підготовку пакета документів Центр бере на себе.",
    },
    {
      id: "about",
      keywords: ["хто ви", "що таке цее", "центр", "ладижин", "про вас", "чим займаєтесь"],
      answer:
        "Центр енергоефективності в Ладижині — технічний експертний центр, що обстежує, рахує, проєктує і доводить інженерні рішення з електрики, тепла, водопостачання та водовідведення до працюючої системи для громад, бізнесу, ОСББ, девелоперів, донорів і приватних власників. Одне вікно замість п'яти виконавців: ви отримуєте результат, а не папку документів.",
    },
    {
      id: "energy-audit",
      keywords: ["енергоаудит", "енергетичний аудит", "аудит", "обстеження", "вимірювання", "енергоефективність", "що таке енерго", "енергосертифікат", "сертифікат енергоефективності", "теплові втрати", "тепловізор"],
      answer:
        "Енергоаудит (обстеження) — це перший крок будь-якого проєкту: ми знімаємо профіль споживання за даними обліку, перевіряємо стан обліку і потужність приєднання, оглядаємо будівлю й обладнання і визначаємо, де саме втрачається енергія та гроші. Результат — не папка, а перелік заходів із розрахованим ефектом і черговістю: з чого почати, що дасть найбільше, що можна відкласти. Далі за бажанням — розрахунок, проєкт і впровадження під ключ. Щоб оцінити обсяг для вашого об'єкта, залиште контакт тут у чаті.",
    },
  ],
  en: [
    {"id": "wastewater", "keywords": ["wastewater", "sewer", "sewage", "effluent"], "answer": "Wastewater is one of CEE's engineering areas. We start with discharge data, network and equipment condition, and site constraints, then compare options, design and support implementation. Treatment requirements, scope and outcome measures are agreed for the specific site; we do not invent standards or guarantee savings."},
    {"id": "water", "keywords": ["water", "water supply", "water provision", "water leak", "drinking water"], "answer": "CEE works on water supply: water metering and balances, leaks, pressure, pump operation and network condition. These findings guide the measures, design and verification of results. To scope the work, we need available consumption data, a network description and the owner's objective."},
    {"id": "heat", "keywords": ["heating", "heat pump", "heat supply", "boiler", "district heat", "thermal"], "answer": "CEE works on heating and heat supply: heat metering, losses, equipment operation, networks and controls. We start with data and a survey, compare options, design and support implementation. Results are assessed against agreed measures, accounting for weather and how the site is used."},
    {"id": "electricity", "keywords": ["electricity", "electrical", "power supply"], "answer": "Electricity is one of CEE's engineering areas alongside heating, water supply and wastewater. Metering, assessment and analysis of electricity use often provide the quickest starting point for finding improvements. We assess loads, capacity, networks and operating patterns; solar and BESS are options justified by site data, not mandatory purchases."},
    {
      id: "pricing",
      keywords: ["price", "cost", "how much", "payment", "quote", "budget", "expensive"],
      answer:
        "There is no standard price list — scope depends on the state of the site, the data available and how deep we go: from a one-off expert opinion to a turnkey project. The fastest way to a number is to leave a name and phone or email right here in the chat: a specialist will look at your situation and clarify the next steps.",
    },
    {
      id: "how-it-works",
      keywords: ["how does it work", "process", "steps", "stages", "where to start", "first step"],
      answer:
        "We start with a survey and measurement: resource consumption profiles, metering, networks, equipment and site constraints. Then calculation and modelling, then a design solution — and turnkey implementation: procurement, partner contractors, works control, result verification against metering data. You deal with a single window, not five contractors.",
    },
    {
      id: "single-window",
      keywords: ["single window", "turnkey", "contractor", "who does the work", "installation", "do it yourselves"],
      answer:
        "We see it through to the end — ourselves or with partner contractors where hands are needed. The expert, technical and technological role stays with the Center: we set the requirements, control execution and sign off the work. A project ends with a working system confirmed by metering data, not with a folder of documents.",
    },
    {
      id: "manager",
      keywords: ["manager", "contact", "consultation", "phone", "talk to a person", "call me", "specialist"],
      answer:
        "The fastest way is to leave a contact right here: press \"Leave a contact\", enter a name and a phone or email. Your enquiry will be passed to a Center specialist. The form on the Contacts page works too.",
    },
    {
      id: "support",
      keywords: ["support", "technical", "problem", "not working", "broken"],
      answer:
        "For technical questions about installed equipment, please describe what stopped working and when — and leave a contact. If the system was implemented through the Center, we know its composition and can help faster.",
    },
    {
      id: "osbb-programs",
      keywords: ["hoa", "program", "programme", "grant", "loan", "financing", "grindim", "energodim", "co-owners"],
      answer:
        "For HOAs, the HOAs page describes project preparation. This local reference does not verify current funding programmes: confirm current terms and availability with the programme administrator. The typical path: measure the consumption profile, check connection capacity, hold a co-owners' meeting, prepare documents, choose a funding source, submit. The Center helps with all of it.",
    },
    {
      id: "ses-bess",
      keywords: ["solar", "battery", "storage", "bess", "pv", "panels", "generation"],
      answer:
        "Solar generates your own electricity on the roof. Storage (BESS) keeps surplus generation or night-tariff energy and powers critical loads during outages. We size capacity to the actual consumption profile, not the roof area — which is why we start with measurement.",
    },
    {
      id: "developers",
      keywords: ["developer", "grid connection", "dso", "technical conditions", "investor", "financial model", "mw", "res project"],
      answer:
        "For RES and BESS developers the Center is a bridge between the investment and the site: technical conditions and connection risk analysis, a DSO interaction package, a technical specification, a financial model with scenarios, and works quality control. Three things we answer for: quality, adaptability to real constraints, and realism — if a project won't fly, we say so at the analysis stage.",
    },
    {
      id: "donors",
      keywords: ["donor", "ngo", "project package", "grant application", "impact logic", "reporting", "consortium"],
      answer:
        "For donors, NGOs and investors we prepare an evidence-based project package: concept, budget, impact logic, a full submission set — and hold technical support of implementation on the ground, with contractor control and result verification against metering data. We know the community, so the package matches the reality of the facilities, not just the application form.",
    },
    {
      id: "digital",
      keywords: ["metering", "meter", "monitoring", "online", "dashboard", "app", "energy management", "iso 50001", "analytics"],
      answer:
        "The digital circuit is what stays on site after the project: modern metering with an hourly profile, online tracking of consumption and generation with alerts, analytics for a director or a board, applications built for the specific site, and energy management as an ongoing process. If there isn't one, we set it up; if there is one but it doesn't work, we rebuild it.",
    },
    {
      id: "formats",
      keywords: ["format", "retainer", "one-off", "opinion", "support", "partnership", "cooperation", "how you work"],
      answer:
        "Five formats: a one-off consultation or expert opinion, a retainer, project support for a single stage, a turnkey project (the main format) and strategic partnership or consortium. The format follows the task — you can start with an idea check and go deeper from there.",
    },
    {
      id: "citizens",
      keywords: ["private house", "my house", "homeowner", "roof", "for myself", "home"],
      answer:
        "For a private house we do the same as for large sites, just at a smaller scale: we assess electricity, heating, water supply and wastewater and agree priorities. Solar and storage are considered where supported by the site data and needs. If contractors have already made you an offer, we can give an expert opinion before you pay.",
    },
    {
      id: "documents",
      keywords: ["documents", "what's needed", "paperwork", "requirements", "checklist"],
      answer:
        "The list depends on the segment and programme. For HOAs typically: a co-owners' meeting decision, grid connection technical conditions, a cost estimate, financial statements and association registration documents. For developers — technical conditions, site baseline data, investor requirements. The Center takes document preparation on itself.",
    },
    {
      id: "about",
      keywords: ["who are you", "what is cee", "the center", "ladyzhyn", "about you", "what do you do"],
      answer:
        "The Center for Energy Efficiency in Ladyzhyn is a technical expert center that surveys, calculates, designs and carries electricity, heating, water supply and wastewater solutions through to a working system for communities, businesses, HOAs, developers, donors and private owners. A single window instead of five contractors: you get a result, not a folder of documents.",
    },
    {
      id: "energy-audit",
      keywords: ["energy audit", "audit", "survey", "assessment", "measurement", "energy efficiency", "what is energy", "energy certificate", "heat loss", "thermal imaging"],
      answer:
        "An energy audit (survey) is the first step of any project: we take the consumption profile from metering data, check the metering and the grid connection capacity, inspect the building and equipment, and pinpoint where energy and money are being lost. The result is not a folder but a list of measures with calculated effect and priority: what to start with, what gives the most, what can wait. From there, optionally: calculation, design and turnkey implementation. To scope it for your site, leave your contact here in the chat.",
    },
  ],
};

const NO_MATCH: Record<Locale, string> = {
  uk: "Гарне питання — і чесна відповідь: у мене немає точних даних, щоб на нього відповісти, а вигадувати я не буду. Залиште контакт тут у чаті (ім'я і телефон або пошта) — щоб фахівець Центру міг уточнити вашу задачу. Або спитайте про порядок дій, електрику, тепло, водопостачання й водовідведення, СЕС і накопичувачі або формати співпраці.",
  en: "Good question — and the honest answer is that I don't have exact data to answer it, and I won't make it up. Leave a contact here in the chat (a name and a phone or email) — so a Center specialist can clarify your task. Or ask about the process, electricity, heating, water supply, wastewater, solar and storage, or ways of working.",
};

function normalize(s: string) {
  return s.toLowerCase().replace(/['ʼ’]/g, "'");
}

export function answerFromKnowledgeBase(
  message: string,
  locale: Locale
): { answer: string; matched: boolean; topic: string | null } {
  const entries = ENTRIES[locale] ?? ENTRIES.uk;
  const q = normalize(message);

  let best: { entry: KBEntry; score: number } | null = null;
  for (const entry of entries) {
    let score = 0;
    for (const kw of entry.keywords) {
      const needle = normalize(kw);
      // Ukrainian entries intentionally contain stems; English keywords are whole words.
      // Never match "water" inside "wastewater" or "heat" inside "cheat".
      const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const boundary = locale === "en" ? "(?![\\p{L}\\p{N}])" : "";
      if (new RegExp(`(?:^|[^\\p{L}\\p{N}])${escaped}${boundary}`, "u").test(q)) {
        score += kw.split(" ").length;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }

  if (best) {
    return { answer: best.entry.answer, matched: true, topic: best.entry.id };
  }
  return { answer: NO_MATCH[locale] ?? NO_MATCH.uk, matched: false, topic: null };
}
