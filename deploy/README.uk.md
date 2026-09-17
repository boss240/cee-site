# Розгортання сайту ЦЕЕ

Два способи. Обидва перевірені на тому самому коді; обирайте за тим, де зручніше платити й керувати.

| | Vercel + Neon | Власний VPS (Docker) |
|---|---|---|
| Складність | Низька: два акаунти, кілька кліків | Середня: потрібен SSH і базове знання Linux |
| Ціна на старті | Безкоштовні тарифи обох сервісів | Від ~5 €/міс за сервер |
| Де дані | Neon (хмара, регіон ЄС) | На вашому сервері |
| HTTPS | Автоматично | Автоматично (Caddy) |
| Оновлення | git push → авто-деплой | `git pull && docker compose up -d --build` |

Перед будь-яким деплоєм: сайт має бути протестований локально (`run-local.ps1`) і код — у git-репозиторії (GitHub/GitLab).

---

## Варіант A — Vercel + Neon

### 1. База даних (Neon)
1. Зареєструйтесь на neon.tech, створіть проєкт (регіон — Frankfurt).
2. Скопіюйте **Connection string** (починається з `postgresql://…neon.tech/…?sslmode=require`).
3. На своєму комп'ютері, у папці проєкту, застосуйте схему і початкові дані до хмарної бази:
   ```powershell
   $env:DATABASE_URL="postgresql://…neon.tech/…?sslmode=require"
   $env:SEED_ADMIN_EMAIL="admin@ваш-домен"
   $env:SEED_ADMIN_PASSWORD="надійний-пароль"
   npm run db:push
   npm run db:seed
   ```

### 2. Сайт (Vercel)
1. Залийте код у GitHub. Зареєструйтесь на vercel.com через GitHub, **Add New → Project**, оберіть репозиторій. Framework визначиться сам (Next.js).
2. У **Environment Variables** додайте (значення — з `deploy/env.production.example`):
   `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `NEXT_PUBLIC_APP_URL`,
   і за потреби `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`, `SMTP_*`, `MAIL_FROM`, `NOTIFY_TO`, `TELEGRAM_*`.
   `NEXTAUTH_URL` і `NEXT_PUBLIC_APP_URL` = адреса сайту, наприклад `https://cee.example.com`.
3. **Deploy**. За хвилину сайт доступний на `*.vercel.app`.
4. **Settings → Domains** — додайте свій домен, у реєстратора домену пропишіть DNS-записи, які покаже Vercel.

Оновлення сайту далі — просто `git push` у головну гілку.

---

## Варіант B — VPS із Docker

Підходить Hetzner, DigitalOcean, українські провайдери. Мінімум: 1 vCPU, 2 GB RAM, Ubuntu 22.04+.

### 1. Сервер
```bash
# один раз, на сервері
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker
git clone <адреса-вашого-репозиторію> cee-site && cd cee-site
cp deploy/env.production.example .env.production
nano .env.production        # заповнити SITE_DOMAIN, паролі, секрети
```

### 2. DNS
У реєстратора домену: A-запис `cee.example.com → IP сервера`. Дочекайтесь, поки запис почне працювати (`ping cee.example.com`). Без цього Caddy не отримає сертифікат.

### 3. Запуск
```bash
docker compose up -d --build                       # збірка ~3–5 хв першого разу
docker compose --profile tools run --rm migrate    # схема БД + адмін + стартові дані (один раз; і після оновлень схеми)
docker compose logs -f app                         # переконатись, що «Ready»
```
Відкрийте `https://ваш-домен` — сертифікат уже є. Адмінка: `/uk/admin/login`.

### 4. Оновлення
```bash
git pull && docker compose up -d --build
```

### 5. Резервні копії бази
```bash
docker compose exec db pg_dump -U cee cee_site | gzip > backup-$(date +%F).sql.gz
```
Поставте це в cron раз на добу і копіюйте файли за межі сервера.

---

## Після першого запуску (обидва варіанти)

1. Зайдіть в адмінку і **змініть пароль адміністратора**: меню → Обліковий запис. Пароль із `SEED_ADMIN_PASSWORD` після цього можна прибрати з конфігурації.
2. **Білінг → реквізити**: заповніть адресу, телефон, пошту — вони автоматично з'являться в «Контактах» і підвалі.
3. **Дашборд → Канали спілкування**: натисніть «Перевірити канали», щоб побачити, що пошта/Telegram працюють.
4. Надішліть тестову заявку з форми і переконайтесь, що вона з'явилась у **Заявках**.
5. Перевірте `https://ваш-домен/sitemap.xml` і `robots.txt`; додайте сайт у Google Search Console.
6. **База знань**: у адмінці → Дайджести → вкладка «Джерела» натисніть «Перевірити» біля кожного джерела і увімкніть ті, що віддають новини. Задайте `CRON_SECRET` і поставте виклик `/api/cron/fetch-news` за розкладом (Vercel — уже у `vercel.json`; VPS — рядок у crontab нижче), щоб стрічка оновлювалась сама.
   ```bash
   # VPS: щодня о 05:00
   0 5 * * * curl -fsS -H "Authorization: Bearer ВАШ_CRON_SECRET" https://ваш-домен/api/cron/fetch-news > /dev/null
   ```
7. **Тарифи**: поки платіжний шлюз не підключено, ціни на `/knowledge/pricing` показуються як «уточнюється», а платний план призначається вручну в адмінці → Користувачі. Коли визначитесь із цінами — впишіть їх у `lib/knowledge/plans.ts` (`priceMonth`).

## Що де лежить
- Тексти сайту — `messages/uk.json`, `messages/en.json` (після зміни — новий деплой).
- Програми фінансування для ОСББ — `lib/programs.ts` (з датою перевірки).
- Статті блогу, заявки, послуги, реквізити, AI-моделі — в адмінці.
- Листи — `lib/notify/templates.ts`.
- База знань: картки документів і журнал змін, джерела RSS, дайджести, користувачі та їхні плани — в адмінці; ліміти й плани — `lib/knowledge/plans.ts`; стартовий набір документів — `lib/db/seedDocuments.ts`.
- Юридичні тексти — у `messages/*.json`, розділи `PrivacyPage` і `TermsPage`. Перед публікацією варто показати юристу.
