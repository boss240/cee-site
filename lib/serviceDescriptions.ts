/** Explanatory copy only: no prices, guarantees or implied regulated qualifications. */
export const serviceIds = ["survey", "concept", "technical-specification", "investment-preparation", "procurement-support", "monitoring"] as const;
export const serviceSections = ["why", "data", "result", "limits", "next"] as const;
export type ServiceDescription = Record<typeof serviceSections[number], string>;

const descriptions: Record<"uk" | "en", ServiceDescription[]> = {
  uk: [
    {
      why: "Щоб рішення відповідало реальному стану об’єкта, спочатку з’ясовуємо, як працюють його електричні, теплові та водні системи й де бракує даних.",
      data: "Корисні наявні схеми, рахунки й покази лічильників, опис обладнання, режим роботи та відомі проблеми. Якщо частини даних немає, погодимо, що потрібно зібрати або виміряти.",
      result: "Опис вихідного стану, перелік обмежень і ризиків та погоджений план подальших вимірювань або аналізу.",
      limits: "Склад огляду й вимірювань визначаємо для конкретного об’єкта. Попереднє обстеження не замінює обов’язкових експертиз, випробувань чи проєктної документації; потребу спеціалізованих виконавців уточнюємо до роботи.",
      next: "Опишіть об’єкт і питання, яке хочете вирішити. Разом погодимо початкові дані та обсяг першого етапу.",
    },
    {
      why: "Щоб обрати обґрунтований напрям модернізації, порівнюємо кілька технічних варіантів до закупівлі обладнання або початку проєктування.",
      data: "Потрібні опис потреб, дані обліку, технічні обмеження, режим роботи й доступні бюджетні орієнтири. Усі суттєві припущення фіксуємо окремо.",
      result: "Порівняння сценаріїв, попередня оцінка витрат і можливого ефекту, основні ризики та рекомендація щодо наступного етапу.",
      limits: "Концепція та передТЕО мають погоджену глибину опрацювання. Вони не є робочим проєктом, кошторисною гарантією або обіцянкою економії чи окупності.",
      next: "Розкажіть про мету й наявні варіанти. Узгодимо, які сценарії порівняти та яких даних бракує для рішення.",
    },
    {
      why: "Чітке технічне завдання допомагає клієнту й виконавцям однаково розуміти потребу, межі робіт і спосіб перевірки результату.",
      data: "Використовуємо погоджену концепцію, характеристики об’єкта, вимоги до надійності та експлуатації, обмеження майданчика й вимоги замовника.",
      result: "Структурований перелік функціональних і технічних вимог, меж відповідальності, вихідних даних та критеріїв приймання наступного етапу.",
      limits: "ТЗ не замінює проєктну документацію та передбачені законодавством погодження. Остаточний склад вимог і відповідальних сторін затверджуємо із замовником.",
      next: "Повідомте, для якого етапу потрібне ТЗ та хто буде його використовувати. Погодимо структуру й порядок узгодження.",
    },
    {
      why: "Щоб клієнт, інвестор або фінансова організація могли оцінити проєкт, технічні варіанти й фінансові припущення потрібно звести у зрозумілий пакет.",
      data: "Потрібні потреби об’єкта, сценарії рішення, вихідні розрахунки, доступні бюджетні оцінки та вимоги конкретної програми або інвестора, якщо вони вже відомі.",
      result: "Матеріали для обґрунтованого рішення: опис обсягу, бюджетні сценарії, ризики, етапність та показники перевірки очікуваного результату.",
      limits: "ЦЕЕ не видає кредити й не гарантує отримання фінансування. Рішення про кредит або грант ухвалює відповідний банк чи організація; умови й перелік документів потрібно звіряти для конкретного звернення.",
      next: "Опишіть проєкт і заплановане джерело фінансування. Узгодимо, які матеріали потрібні та що вже підготовлено.",
    },
    {
      why: "Щоб порівняння пропозицій було змістовним, зіставляємо їх за однаковими технічними вимогами, комплектацією та умовами експлуатації.",
      data: "Потрібні погоджене ТЗ, отримані пропозиції, критерії вибору, обмеження строків і вимоги до майбутньої експлуатації.",
      result: "Порівняння технічних параметрів і меж пропозицій, перелік уточнень до виконавців та виявлені розбіжності з вимогами замовника.",
      limits: "Обсяг супроводу погоджується окремо. Він не означає автоматичного юридичного супроводу закупівлі або прийняття рішення замість замовника; формальні процедури й відповідальність визначаються окремо.",
      next: "Надішліть опис закупівельної задачі та наявність ТЗ або пропозицій. Визначимо критерії порівняння й межі супроводу.",
    },
    {
      why: "Після реалізації важливо перевірити, як система працює на практиці та чи відповідають показники погодженим критеріям.",
      data: "Використовуємо базові показники до змін, поточний облік, режими роботи й відомості про зміни навантаження, погоди або інших значущих умов.",
      result: "Зіставлення фактичних і базових показників, пояснення відхилень та пропозиції щодо наступних перевірок або налаштувань.",
      limits: "Достовірність висновків залежить від якості й порівнюваності даних. Моніторинг не є гарантією економії та не замінює обов’язкових перевірок безпеки чи спеціального технічного нагляду.",
      next: "Розкажіть, що вже впроваджено та які дані доступні. Погодимо період спостереження, базу порівняння й формат результату.",
    },
  ],
  en: [
    {
      why: "To match a solution to the facility’s actual condition, we first establish how its electricity, heat and water systems operate and where evidence is missing.",
      data: "Existing drawings, bills and meter readings, equipment descriptions, operating schedules and known issues are useful. If information is missing, we agree what needs to be collected or measured.",
      result: "A description of the baseline condition, a list of constraints and risks, and an agreed plan for further measurements or analysis.",
      limits: "The survey and measurement scope is defined for the particular facility. A preliminary survey does not replace mandatory assessments, tests or design documentation; any need for specialist contractors is clarified before work starts.",
      next: "Describe the facility and the question you want to resolve. Together, we will agree the initial data and scope of the first stage.",
    },
    {
      why: "To choose a well-founded direction for modernisation, we compare technical options before equipment procurement or detailed design begins.",
      data: "We need the stated needs, metering data, technical constraints, operating schedule and available budget estimates. Material assumptions are recorded separately.",
      result: "A comparison of scenarios, preliminary costs and potential benefits, key risks and a recommendation for the next stage.",
      limits: "Concept and pre-feasibility work have an agreed level of detail. They are not detailed design, a guaranteed cost estimate or a promise of savings or payback.",
      next: "Tell us about the objective and options being considered. We will agree which scenarios to compare and what evidence is still needed.",
    },
    {
      why: "A clear technical specification helps the client and contractors share an understanding of the need, scope and how the result will be checked.",
      data: "We use the agreed concept, facility characteristics, reliability and operating requirements, site constraints and the client’s requirements.",
      result: "A structured set of functional and technical requirements, responsibility boundaries, input data and acceptance criteria for the next stage.",
      limits: "A specification does not replace design documentation or legally required approvals. The final requirements and responsible parties are agreed with the client.",
      next: "Tell us which stage the specification is for and who will use it. We will agree its structure and approval process.",
    },
    {
      why: "For a client, investor or funding body to assess a project, technical options and financial assumptions need to be brought together in a clear package.",
      data: "We need the facility’s needs, solution scenarios, initial calculations, available budget estimates and the requirements of a specific programme or investor, if known.",
      result: "Material for an informed decision: scope, budget scenarios, risks, phasing and indicators for checking the expected outcome.",
      limits: "CEE does not issue loans or guarantee financing. The relevant bank or organisation decides whether to approve a loan or grant; terms and document requirements must be checked for the specific application.",
      next: "Describe the project and planned funding source. We will agree which materials are needed and what is already available.",
    },
    {
      why: "To make offers meaningfully comparable, we assess them against the same technical requirements, equipment scope and operating conditions.",
      data: "We need the agreed specification, received offers, selection criteria, timing constraints and future operating requirements.",
      result: "A comparison of technical parameters and offer boundaries, questions for contractors and identified differences from the client’s requirements.",
      limits: "The support scope is agreed separately. It does not automatically include procurement legal advice or making the decision on the client’s behalf; formal procedures and responsibilities are defined separately.",
      next: "Describe the procurement task and whether a specification or offers are available. We will define the comparison criteria and support boundaries.",
    },
    {
      why: "After implementation, it is important to check how the system performs in practice and whether indicators meet the agreed criteria.",
      data: "We use baseline indicators, current metering, operating schedules and information about changes in load, weather or other relevant conditions.",
      result: "A comparison of actual and baseline indicators, explanations of deviations and suggestions for further checks or adjustments.",
      limits: "Conclusions depend on data quality and comparability. Monitoring does not guarantee savings or replace mandatory safety checks or specialist technical supervision.",
      next: "Tell us what has been implemented and what data is available. We will agree the observation period, comparison baseline and result format.",
    },
  ],
};

export function serviceDescriptions(locale: string) {
  return descriptions[locale === "en" ? "en" : "uk"];
}
