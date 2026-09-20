/**
 * Джерела новин — кандидати. Вимкнені, доки адміністратор не натисне
 * «Перевірити» в адмінці й не побачить, що стрічка віддає елементи.
 * Адреси RSS у держорганів змінюються; це стартовий список, не істина.
 */
export const SEED_SOURCES = [
  { name: "НКРЕКП — новини", url: "https://www.nerc.gov.ua/rss", category: "regulator", enabled: false },
  { name: "Міненерго — новини", url: "https://mev.gov.ua/rss", category: "government", enabled: false },
  { name: "Укренерго — новини", url: "https://ua.energy/feed/", category: "operator", enabled: false },
  { name: "Урядовий портал — новини", url: "https://www.kmu.gov.ua/rss/news", category: "government", enabled: false },
  { name: "Верховна Рада — новини", url: "https://www.rada.gov.ua/rss/news", category: "government", enabled: false },
  { name: "Держенергоефективності", url: "https://saee.gov.ua/uk/rss", category: "government", enabled: false },
  { name: "Фонд енергоефективності", url: "https://eefund.org.ua/feed", category: "government", enabled: false },
  { name: "Оператор ринку (ОРЕЕ)", url: "https://www.oree.com.ua/index.php/rss", category: "market", enabled: false },
  // Місцеві джерела для дайджесту «Місцеві новини» (kind = local). Адреси RSS перевірити в адмінці.
  // Telegram-канали (t.me/ladyzhyn_info, t.me/ladizhinvkursi) і Facebook-сторінки сюди свідомо не додані:
  // rss-parser не вміє їх читати (Facebook Graph API взагалі вимагає App Review від Meta) — це окрема
  // задача на ручну або спеціалізовану інтеграцію, не RSS-джерело. Список — у проєктному документі.
  { name: "Ладижинська міська рада — новини", url: "https://ladrada.gov.ua/index.php?option=com_content&view=category&layout=blog&id=55&format=feed&type=rss", category: "local", enabled: false },
  { name: "Вінницька обласна військова адміністрація", url: "https://www.vin.gov.ua/rss", category: "local", enabled: false },
  { name: "Вінницька обласна рада", url: "https://vinrada.gov.ua/rss", category: "local", enabled: false },
  { name: "Гайсинська РДА — новини", url: "https://haysynrayrada.gov.ua/rss", category: "local", enabled: false },
  { name: "КП «Ладижинський ККП» (благоустрій)", url: "https://ladrada.gov.ua/komunalni-pidpryiemstva/kp-ladyzhynskyi-kkp.html", category: "local", enabled: false },
  { name: "КП «Ладводоканал»", url: "https://ladrada.gov.ua/komunalni-pidpryiemstva/kp-ladvodokanal.html", category: "local", enabled: false },
  { name: "DTEK Ладижинська ТЕС — прес-центр", url: "https://energo.dtek.com/media-center/press/", category: "local", enabled: false },
  { name: "Вінницяобленерго — графіки відключень", url: "https://voe.com.ua/disconnection", category: "local", enabled: false },
  { name: "ladyzhyn.today — місцеві новини", url: "https://ladyzhyn.today/local-news/", category: "local", enabled: false },
  { name: "ladyzhyn.news", url: "https://ladyzhyn.news/", category: "local", enabled: false },
  { name: "ВітаТВ — Ладижин", url: "https://vitatv.com.ua/m-ladyzhyn", category: "local", enabled: false },
  { name: "i-vin.info", url: "https://i-vin.info/", category: "local", enabled: false },
  { name: "Podilske.com / PodilskeRadio", url: "https://www.podilske.com/", category: "local", enabled: false },
  { name: "Open Budget — бюджет громади", url: "https://openbudget.gov.ua/local-budget/0255600000/info/profile", category: "local", enabled: false },
];

/** Вступний дайджест — пояснює, як влаштовані дайджести ЦЕЕ. Далі дайджести створюються з реальних новин. */
export const SEED_DIGEST = {
  slug: "yak-pratsyuyut-daidzhesty-tsee",
  title: "Як працюють дайджести ЦЕЕ",
  periodFrom: null as Date | null,
  periodTo: null as Date | null,
  intro: "Що це за розділ, звідки беруться новини і як їх читати.",
  body: `## Що таке дайджест ЦЕЕ

Дайджест — це стислий огляд змін в українській енергетиці за період, відібраний під практичні потреби громад, ОСББ, бізнесу й девелоперів: що змінилось у регулюванні, які програми відкрились чи закрились, що ухвалив регулятор, що варто врахувати в проєкті.

## Звідки новини

Стрічку збираємо автоматично з офіційних джерел — регулятора (НКРЕКП), Міненерго, оператора системи передачі, Фонду енергоефективності, Урядового порталу, Верховної Ради — і з галузевих медіа. Перелік джерел відкритий і поповнюється.

## Хто відбирає

Автоматика лише збирає. Відбір і коментар «що це означає для вас» робить фахівець Центру. Дайджест публікується тільки після перевірки: ми не переказуємо чуток і не наводимо цифр без джерела.

## Як читати

Кожен пункт має посилання на першоджерело. Якщо зміна стосується документа з нашої бази — поруч буде посилання на його картку з журналом змін. Якщо не зрозуміло, як зміна впливає на ваш об'єкт, — спитайте помічника в розділі «Консультація» або залиште заявку.`,
};
