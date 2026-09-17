# Сайт Центру Енергоефективності — Ладижин (v12)

Повнофункціональний прототип: 2 мови (uk/en), 2 теми (світла/темна),
AI-помічник з автоматичним фолбеком між моделями, і адмін-панель з
авторизацією та реальною базою даних.

## Стек

| | |
|---|---|
| Next.js | 16.3.3 (App Router, Turbopack) |
| React | 19.2.8 |
| Tailwind CSS | 4.3.3 (CSS-first конфіг, без `tailwind.config`) |
| i18n | next-intl (uk/en, `localePrefix: always`) |
| Теми | next-themes (клас `.dark`, авто prefers-color-scheme) |
| БД / ORM | PostgreSQL + **Drizzle ORM** (не Prisma — див. нижче) |
| Авторизація адмінки | NextAuth (Credentials, JWT-сесія) |
| AI | Vercel AI SDK (`ai`, `@ai-sdk/openai`, `@ai-sdk/anthropic`) з власним фактором фолбеку |
| PDF-інвойси | `@react-pdf/renderer` |
| TypeScript | 5.x, `strict` |

## ⚠️ Чому Drizzle, а не Prisma

ТЗ пропонував Prisma. У середовищі розробки завантаження нативних
бінарників Prisma (`query-engine`/`schema-engine`) з `binaries.prisma.sh`
було заблоковане мережевою політикою пісочниці (підтверджено: 403 Forbidden
на рівні проксі). Це стосується будь-якого сценарію Prisma, включно з
`driverAdapters` — міграції все одно виконує `schema-engine`-бінарник.

Скориставшись пунктом ТЗ «Розробник може запропонувати альтернативи за
умови технічного обґрунтування», використано **Drizzle ORM**:
- чистий TypeScript, без нативних бінарників, працює напряму через `pg`;
- API дуже схоже на Prisma (типобезпечні запити, схема як код `lib/db/schema.ts`);
- міграції — звичайний SQL, застосовується без мережевих залежностей.

Якщо на продакшен-хостингу мережа не обмежена — команда може мігрувати
на Prisma без зміни бізнес-логіки: весь доступ до БД ізольований у `lib/db`.

## Швидкий запуск на Windows (один скрипт)

```powershell
powershell -ExecutionPolicy Bypass -File .\run-local.ps1
```

Скрипт перевірить Node.js і PostgreSQL, створить базу `cee_site`, `.env.local`
(запитає лише пароль `postgres`), поставить залежності, застосує схему, наповнить
початкові дані, звільнить порт 3000 і запустить сайт: http://localhost:3000/uk

## Запуск (вручну)

```bash
npm install

# 1) Підняти PostgreSQL і створити БД (якщо ще нема)
#    createdb cee_site

cp .env.example .env.local   # і заповнити значення (див. нижче)

npm run db:push     # створити таблиці за схемою lib/db/schema.ts
npm run db:seed      # перший адмін + дефолтні AI-моделі + профіль компанії

npm run dev           # http://localhost:3000
npm run build         # продакшн-збірка
```

### Змінні середовища (`.env.local`)

| Змінна | Призначення |
|---|---|
| `DATABASE_URL` | рядок підключення до PostgreSQL |
| `OPENAI_API_KEY` | ключ OpenAI (опційно — без нього AI працює на базі знань) |
| `ANTHROPIC_API_KEY` | ключ Anthropic (резервна модель) |
| `NEXTAUTH_SECRET` | секрет для підпису JWT-сесій адмінки (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | базовий URL застосунку |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | дані першого адміна, які прочитає `npm run db:seed` |

**Без `OPENAI_API_KEY`/`ANTHROPIC_API_KEY` AI-помічник продовжує працювати** —
`lib/ai-factory.ts` бачить відсутність ключа, логує це як помилку конкретної
моделі і тихо переходить на локальну базу знань (`lib/knowledgeBase.ts`).
Користувач ніколи не бачить помилку.

## Команди БД

```bash
npm run db:push      # застосувати схему до БД (без файлів міграцій, для розробки)
npm run db:generate  # згенерувати SQL-файли міграцій (для продакшену/CI)
npm run db:seed      # наповнити початковими даними
npm run db:studio    # Drizzle Studio — візуальний перегляд БД
```

## Адмін-панель (`/uk/admin`, `/en/admin`)

Захищена NextAuth (Credentials + JWT). Вхід — `/admin/login`. Перший
адмін створюється командою `npm run db:seed` (email/пароль зі змінних
`SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD`).

Розділи:
- **Дашборд** — реальна статистика з `ai_usage_logs` (кількість діалогів,
  % успіху, час відгуку, вартість, лог помилок). Відвідуваність сайту —
  досі демо-дані (веб-аналітика не підключалась в цьому етапі).
- **Послуги** — CRUD, зберігається в PostgreSQL (`services`).
- **Опитування** — конструктор питань UI; результати (хмара слів, NPS)
  поки демонструються на прикладних даних — публічна форма проходження
  опитування на сайті не була частиною цього етапу.
- **Білінг** — реквізити компанії (БД), рахунки (БД) з генерацією
  справжнього PDF (`@react-pdf/renderer`, шрифт DejaVu Sans для кирилиці),
  платіжні шлюзи — перемикач статусу підключення (сама інтеграція з
  WayForPay/LiqPay/Stripe/Fondy API не входила в цей етап).
- **AI-моделі** — CRUD моделей, пріоритет фолбеку, кнопка «Перевірити
  з'єднання», перемикач «Основна». Вимкнення/збій основної моделі
  автоматично й непомітно для користувача перемикає на наступну активну
  за пріоритетом — перевірено: `ai_usage_logs` показує ланцюжок
  `error → error → fallback` при відсутніх ключах.

## Структура (ключове)

```
lib/db/schema.ts          # Drizzle-схема: adminUsers, aiModels, aiUsageLogs,
                           # services, surveys/*, companyProfile, invoices,
                           # paymentGateways
lib/db/index.ts           # drizzle(pool)
lib/db/seed.ts             # npm run db:seed
lib/auth/options.ts        # NextAuth Credentials-провайдер
lib/auth/requireAdmin.ts   # guard для /api/admin/*
lib/ai-factory.ts          # багатомодельний AI з фолбеком + логування
lib/pdf/InvoiceDocument.tsx
app/api/chat/route.ts      # AI-помічник
app/api/admin/**           # адмінське REST API (усі маршрути перевіряють сесію)
app/[locale]/admin/login   # публічна сторінка входу
app/[locale]/admin/(protected)/  # усе інше в адмінці — за NextAuth-сесією
```

## Відомі обмеження цього етапу

- Веб-аналітика (реальні відвідувачі сайту) не підключена — на дашборді
  досі демо-числа поруч із реальними AI-метриками.
- Проходження опитувань відвідувачами сайту (публічна форма) не
  реалізоване — конструктор і CRUD питань в адмінці є, результати —
  приклад даних.
- Платіжні шлюзи — тільки перемикач «підключено/ні» в адмінці, без
  реальних API-інтеграцій прийому платежів.
- Відеофони — досі Canvas 2D-анімація (свідома заміна Three.js/відео,
  див. попередній звіт v11).
- ESLint у проєкті не був сконфігурований (успадковано з попередніх
  етапів) — якість коду перевірена через `tsc --noEmit` (0 помилок) та
  чистий `next build`.
