/**
 * Стартові статті блогу. Зміст — із матеріалів сайту і стратегічного документа.
 * Жодних цифр, яких немає на сайті. Адміністратор може редагувати їх в адмінці.
 */
export const SEED_POSTS = [
  {
    slug: "chomu-pochynaemo-z-elektroenergii",
    tag: "Порядок дій",
    titleUk: "Чому починаємо з електроенергії, а не з утеплення",
    titleEn: "Why we start with electricity, not insulation",
    excerptUk: "Тепло теж потрібне — але воно дорожче, довше й важче піддається перевірці. Електроенергія дає точку опори: її видно в лічильнику, вона швидко реагує на зміни і відчутна в грошах.",
    excerptEn: "Heat matters too — but it is more expensive, slower and harder to verify. Electricity gives a foothold: it is visible on the meter, reacts quickly and is felt in the wallet.",
    bodyUk: `Коли будинок або підприємство береться за енергоефективність, перше, що спадає на думку — утеплення. Це логічно: стіни видно, тепло втрачається, рахунки за опалення великі. Але ми свідомо починаємо з іншого кінця — з електроенергії. Ось чому.

## Її видно в лічильнику

Лічильник показує кіловат-години щодня. Є з чим порівняти «до» і «після», а не оцінка на око. З цих даних будується розрахунок, який можна перевірити. Теплові втрати теж можна виміряти, але це дорожче, довше і залежить від сезону.

## Швидше за інші рішення

Обладнання для генерації і зберігання електроенергії встановлюється за дні або тижні, а не за сезон. Воно не потребує риштувань, погодних умов і зупинки життя будинку. Утеплення — це місяці робіт і узгоджень.

## Видно в рахунку

Результат приходить наступним платіжним документом. Це важливо, коли рішення ухвалюють збори співвласників: люди бачать, за що заплатили. Ефект від утеплення розмазаний на опалювальний сезон і залежить від погоди — його важче пояснити.

## Життєзабезпечення

Накопичувач тримає критичне навантаження під час відключень: освітлення, насоси, зв'язок, ліфт. Це те, чого утеплення не дає взагалі.

## Термомодернізація нікуди не зникає

Вона йде наступним етапом — коли зрозумілий профіль споживання, є чим підтвердити ефект і є з чого фінансувати внесок співвласників. Порядок важливий: без вимірювання профілю споживання й перевірки потужності приєднання решта рішень ухвалюється навмання.

> Спершу те, що дає віддачу швидше: облік, генерація, зберігання, впорядкування навантаження. Далі — тепло.`,
    bodyEn: `When a building or a business takes up energy efficiency, the first thing that comes to mind is insulation. That is logical: walls are visible, heat is lost, heating bills are large. But we deliberately start from the other end — electricity. Here is why.

## It is visible on the meter

The meter shows kilowatt-hours every day. There is a "before" and "after" to compare, not a guess. A calculation built on this data can be verified. Heat losses can be measured too, but it is more expensive, slower and seasonal.

## Faster than other solutions

Equipment for generating and storing electricity is installed in days or weeks, not a season. No scaffolding, no weather dependency, no disruption to the building. Insulation means months of works and approvals.

## Visible on the bill

The result shows up in the next payment document. That matters when a co-owners' meeting makes the decision: people see what they paid for. The effect of insulation is smeared across the heating season and depends on the weather — harder to explain.

## Life support

A battery keeps critical loads running during outages: lighting, pumps, communications, the lift. Insulation never provides that.

## Thermal modernisation does not go away

It comes as the next stage — once the consumption profile is clear, there is something to confirm the effect with and a way to fund the co-owners' contribution. Order matters.

> First what pays back faster: metering, generation, storage, load management. Then heat.`,
  },
  {
    slug: "odne-vikno-zamist-pyaty-vykonavtsiv",
    tag: "Як ми працюємо",
    titleUk: "Одне вікно: чому енергопроєкти зриваються між п'ятьма виконавцями",
    titleEn: "Single window: why energy projects fall apart between five contractors",
    excerptUk: "Один обстежує, другий рахує, третій проєктує, четвертий монтує, п'ятий звітує — і жоден не відповідає за кінцевий результат. Як Центр збирає це в один контур.",
    excerptEn: "One surveys, another calculates, a third designs, a fourth installs, a fifth reports — and none answers for the final result. How the Center pulls this into one circuit.",
    bodyUk: `Типовий енергопроєкт виглядає так. Замовник замовляє енергоаудит в одній компанії. З аудитом іде до проєктанта. Проєкт віддає на тендер, монтажник виграє і ставить обладнання «як вийшло». Потім хтось пише звіт для програми фінансування. І коли через рік з'ясовується, що економія не така, як обіцяли, — винного немає. Кожен зробив свою частину.

## Де розривається ланцюг

Розрив не в обладнанні. Він у стиках: між профілем споживання, який виміряв аудитор, і потужністю, яку заклав проєктант; між проєктом і тим, що реально змонтував підрядник; між результатом і тим, що потрапило у звіт. На кожному стику губиться відповідальність.

## Що таке одне вікно

Ви спілкуєтеся з Центром, а не з п'ятьма виконавцями. Координація між етапами — наша робота, а не ваша. Доводимо до кінця самі або із залученням підрядників-партнерів — там, де потрібні руки. Але експертна, технічна й технологічна роль лишається за Центром: ми ставимо вимоги, контролюємо виконання і приймаємо роботи.

## Закриваємо результатом

Проєкт завершується не переданою папкою, а працюючою системою, ефект якої підтверджено даними обліку. Критерій приймання один: як у технічному завданні, а не «як вийшло». Підрядник знає, що результат перевірятимуть за лічильником, а не за актом.

## Що це означає для вас

Менше зустрічей, менше узгоджень, одна точка, де можна спитати «як справи». І головне — коли щось піде не так, є хто відповідає. Це і є різниця між результатом і папкою документів.`,
    bodyEn: `A typical energy project looks like this. The client orders an energy audit from one company. Takes the audit to a designer. Puts the design out to tender, an installer wins and installs the equipment "as it turned out". Then someone writes a report for the financing programme. And when a year later the savings are not what was promised, nobody is to blame. Everyone did their part.

## Where the chain breaks

The break is not in the equipment. It is at the joints: between the consumption profile the auditor measured and the capacity the designer assumed; between the design and what the contractor actually installed; between the result and what made it into the report. Responsibility is lost at every joint.

## What a single window is

You talk to the Center, not to five contractors. Coordinating the stages is our job, not yours. We see it through ourselves or with partner contractors where hands are needed. But the expert, technical and technological role stays with the Center: we set the requirements, control execution and sign off the work.

## We close with a result

A project ends not with a folder handed over, but with a working system whose effect is confirmed by metering data. One acceptance criterion: as in the specification, not "as it turned out". The contractor knows the result will be checked against the meter, not a certificate.

## What this means for you

Fewer meetings, fewer approvals, one place to ask "how is it going". And when something goes wrong, there is someone who answers for it. That is the difference between a result and a folder of documents.`,
  },
  {
    slug: "yak-osbb-pidhotuvatysya-do-prohramy-finansuvannya",
    tag: "ОСББ",
    titleUk: "Як ОСББ підготуватися до програми фінансування: сім кроків",
    titleEn: "How an HOA prepares for a financing programme: seven steps",
    excerptUk: "Послідовність приблизно однакова для всіх програм — грантових і кредитних. Найчастіша помилка — починати з подачі заявки, а не з профілю споживання.",
    excerptEn: "The sequence is roughly the same for all programmes — grants and loans. The most common mistake is to start with the application rather than the consumption profile.",
    bodyUk: `Умови програм фінансування для ОСББ змінюються, тому перед поданням заявки варто звірити їх з адміністратором програми. Але порядок підготовки — стабільний. Ось він.

## 1. Зняти профіль споживання

Скільки, коли і на що витрачається електроенергія. Без цих даних потужність СЕС і ємність накопичувача підбираються навмання, а розрахунок окупності недостовірний. Це перший крок, а не останній.

## 2. Перевірити потужність приєднання

Умови договору з оператором мережі обмежують те, що взагалі можна встановити та скільки віддавати в мережу. Дізнатися це після покупки обладнання — дорога помилка.

## 3. Провести збори співвласників

Рішення зборів потрібне для будь-якої програми — і грантової, і кредитної. Без протоколу заявку не приймуть. Зборам потрібні зрозумілі цифри — саме тому попередні два кроки йдуть раніше.

## 4. Підготувати документи

Кошторис, проєктна документація, фінансова звітність ОСББ, документи про реєстрацію об'єднання. Повний перелік залежить від обраної програми.

## 5. Визначити черговість робіт

Спершу те, що дає віддачу швидше: облік, генерація, зберігання, впорядкування навантаження. Термомодернізація — наступним етапом.

## 6. Обрати джерело фінансування

Грант, кредит або їх поєднання. Вибір залежить від обсягу робіт і спроможності ОСББ внести власну частину.

## 7. Подати заявку та супроводжувати проєкт

Після схвалення — вибір підрядника, контроль якості робіт, звітність перед програмою. Центр бере на себе всі сім кроків: від вимірювання до приймання робіт і перевірки результату за даними обліку.

> Подання заявки не гарантує її схвалення — рішення ухвалює комісія програми. Але добре підготовлена заявка з реальним профілем споживання має незрівнянно кращі шанси.`,
    bodyEn: `Financing programme conditions for HOAs change, so check them with the programme administrator before applying. But the preparation order is stable. Here it is.

## 1. Measure the consumption profile

How much, when and on what electricity is used. Without this data, solar capacity and storage size are guessed, and the payback calculation is unreliable. This is the first step, not the last.

## 2. Check connection capacity

The agreement with the grid operator limits what can be installed at all and how much can be fed back. Learning this after buying equipment is an expensive mistake.

## 3. Hold a co-owners' meeting

A meeting decision is required for any programme — grant or loan. Without minutes the application will not be accepted. The meeting needs clear figures — which is why the previous two steps come first.

## 4. Prepare documents

Cost estimate, design documentation, HOA financial statements, association registration documents. The full list depends on the programme.

## 5. Decide the order of works

First what pays back faster: metering, generation, storage, load management. Thermal modernisation — next stage.

## 6. Choose a funding source

Grant, loan or a combination. It depends on the scope and the HOA's ability to contribute its share.

## 7. Apply and support the project

After approval — contractor selection, quality control, reporting to the programme. The Center takes on all seven steps: from measurement to sign-off and result verification against metering data.

> Applying does not guarantee approval — the programme committee decides. But a well-prepared application with a real consumption profile has far better chances.`,
  },
  {
    slug: "bess-ready-chy-mae-sens-nakopychuvach",
    tag: "BESS",
    titleUk: "BESS Ready: як зрозуміти, чи має сенс накопичувач для вашого об'єкта",
    titleEn: "BESS Ready: how to tell whether storage makes sense for your site",
    excerptUk: "Накопичувач — не універсальна відповідь. Він окупається там, де є розрив між часом генерації і споживання, обмеження приєднання або ціна перебоїв. Як це перевірити до покупки.",
    excerptEn: "Storage is not a universal answer. It pays back where generation and consumption are offset in time, where connection is limited, or where outages are costly. How to check before buying.",
    bodyUk: `Установка зберігання енергії (BESS) стала модною відповіддю на будь-яке енергетичне питання. Але накопичувач — це ємність, яку треба чимось заповнити і в потрібний момент розрядити. Якщо на об'єкті немає для цього причини, він просто стоятиме. Ось як ми перевіряємо доцільність до того, як ви витратите гроші.

## Три сценарії, де накопичувач працює

**Генерація і споживання розділені в часі.** Виробництво працює вночі, сонячна станція генерує вдень. Накопичувач запасає денну генерацію і віддає її на нічну зміну.

**Обмеження потужності приєднання.** Оператор мережі не дозволяє підняти потужність, а піки навантаження перевищують ліміт. Накопичувач закриває піки, мережа дає базу.

**Ціна перебоїв.** Обладнання розраховане на безперервну роботу, і кожне відключення — це втрати. Резервне живлення від накопичувача переходить на себе за мілісекунди.

## Що входить у BESS Ready

Це блок роботи, який відповідає на одне питання: чи має економічний сенс накопичувач саме на вашому об'єкті. На виході — попередня доцільність, режими роботи, сценарії окупності на фактичному профілі споживання і технічне завдання для наступного етапу.

## Чому не можна порахувати «в середньому»

Строк служби накопичувача рахується циклами, а не роками. Скільки циклів на день дасть ваш режим — залежить від профілю споживання, тарифу і генерації. Розрахунок на середніх показниках може відрізнятися від реального в рази. Тому починаємо з вимірювання, а не з каталогу обладнання.

> Якщо проєкт не злітає — кажемо це на етапі аналізу, а не після того, як витрачено гроші на проєктування. Це і є реалістичність, за яку ми відповідаємо.`,
    bodyEn: `Battery energy storage (BESS) has become a fashionable answer to any energy question. But storage is a capacity that has to be filled with something and discharged at the right moment. If the site has no reason for that, it will just sit there. Here is how we check feasibility before you spend money.

## Three scenarios where storage works

**Generation and consumption offset in time.** Production runs at night, solar generates by day. Storage keeps daytime generation for the night shift.

**Connection capacity limits.** The grid operator will not allow more capacity, and load peaks exceed the limit. Storage covers the peaks, the grid supplies the base.

**The cost of outages.** Equipment is designed for continuous operation and every outage means losses. Backup from storage takes over in milliseconds.

## What BESS Ready includes

It is a block of work that answers one question: does storage make economic sense on your specific site. The output — preliminary feasibility, operating modes, payback scenarios on the actual consumption profile, and a specification for the next stage.

## Why "on average" does not work

Storage lifetime is counted in cycles, not years. How many cycles a day your regime produces depends on the consumption profile, tariff and generation. A calculation on averages can differ from reality several times over. So we start with measurement, not with an equipment catalogue.

> If a project will not fly, we say so at the analysis stage — not after money has been spent on design. That is the realism we answer for.`,
  },
  {
    slug: "tsyfrovyi-kontur-proekt-ne-zakinchuetsya-zapuskom",
    tag: "Цифровий контур",
    titleUk: "Цифровий контур: чому проєкт не закінчується запуском обладнання",
    titleEn: "The digital circuit: why a project does not end when the equipment is switched on",
    excerptUk: "Щоб результат було видно щодня, а не раз на рік у звіті, на об'єкті потрібен облік, який збирає дані, і система, яка їх показує й дає керувати.",
    excerptEn: "For the result to be visible every day rather than once a year in a report, the site needs metering that collects data and a system that shows it and lets you act.",
    bodyUk: `Обладнання змонтоване, акт підписаний, підрядник поїхав. Здається, проєкт завершено. Але саме тут починається найважливіше: чи дає система той ефект, що був у розрахунку? Без цифрового контуру відповідь на це питання з'явиться в кращому разі через рік, у гіршому — ніколи.

## Облік, який справді рахує

Сучасні системи обліку — це не лише лічильник, а прилади, збір даних і погодинний профіль споживання і генерації. Без погодинних даних будь-який ефект — оцінка на око, а не факт. Якщо обліку немає — організовуємо. Якщо є, але не працює — переробляємо.

## Онлайн-відстеження і контроль

Дані з об'єкта в реальному часі: споживання, генерація, стан накопичувача, відхилення від норми. Сповіщення, коли щось пішло не так, — до того, як це видно в рахунку. Зламаний інвертор, який мовчить три тижні, — це три тижні втраченої генерації.

## Аналітика для управління

Дашборди і звіти, які показують, де саме втрати, як працює обладнання і чи збігається результат із розрахунком. Для керівника, зборів співвласників або донора — у зрозумілому вигляді, а не в таблиці на сорок стовпців.

## Додатки під проєкт

Програмні інструменти під конкретний об'єкт, замовника і його процеси. Не типова панель «як у всіх», а те, з чим ваші люди справді працюватимуть.

## Енергоменеджмент як процес

Політика, відповідальні, показники, регулярний перегляд. Орієнтир — логіка ISO 50001, глибина — під масштаб об'єкта. Енергоменеджмент — це не разовий аудит, а те, що відбувається щомісяця.

> Цифровий контур — це те, що робить обіцянку «закриваємо результатом» перевірною. Саме з його даних ми підтверджуємо ефект після впровадження.`,
    bodyEn: `Equipment installed, certificate signed, the contractor has left. It seems the project is over. But this is exactly where the most important part begins: does the system deliver the effect that was in the calculation? Without a digital circuit the answer appears in a year at best, never at worst.

## Metering that actually counts

Modern metering is not just a meter, but devices, data collection and an hourly profile of consumption and generation. Without hourly data any effect is a guess, not a fact. If there is no metering, we set it up. If there is but it does not work, we rebuild it.

## Online tracking and control

Live data from the site: consumption, generation, battery state, deviations from normal. Alerts when something goes wrong — before it shows up on the bill. An inverter that fails silently for three weeks is three weeks of lost generation.

## Analytics for management

Dashboards and reports that show exactly where the losses are, how the equipment performs and whether the result matches the calculation. For a director, a co-owners' meeting or a donor — in plain form, not a forty-column table.

## Applications built for the project

Software tools for a specific site, client and their processes. Not a generic panel like everyone else's, but something your people will actually use.

## Energy management as a process

Policy, owners, indicators, regular review. Oriented on ISO 50001 logic, scaled to the site. Energy management is not a one-off audit but something that happens every month.

> The digital circuit is what makes the promise "we close with a result" verifiable. It is from its data that we confirm the effect after implementation.`,
  },
];
