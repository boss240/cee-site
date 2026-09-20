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
  { name: "Ладижинська міська рада — новини", url: "https://ladyzhyn-rada.gov.ua/rss", category: "local", enabled: false },
  { name: "Вінницька обласна військова адміністрація", url: "https://www.vin.gov.ua/rss", category: "local", enabled: false },
  { name: "Вінницька обласна рада", url: "https://vinrada.gov.ua/rss", category: "local", enabled: false },
  { name: "Гайсинська РДА — новини", url: "https://gaisin-rda.gov.ua/rss", category: "local", enabled: false },
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
