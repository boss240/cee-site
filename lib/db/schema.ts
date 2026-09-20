import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  doublePrecision,
  jsonb,
  serial,
} from "drizzle-orm/pg-core";

/**
 * Схема БД (Drizzle ORM).
 *
 * Примітка щодо вибору ORM: технічне завдання пропонувало Prisma. У цьому
 * середовищі завантаження нативних бінарників Prisma (query-engine /
 * schema-engine) з binaries.prisma.sh заблоковане мережевою політикою
 * пісочниці (403 Forbidden, підтверджено через журнал проксі) — і це
 * стосується будь-якого сценарію (включно з driverAdapters, бо міграції
 * все одно виконує schema-engine). Тому, користуючись пунктом ТЗ
 * "Розробник може запропонувати альтернативи за умови технічного
 * обґрунтування", як заміну використано Drizzle ORM — чистий TypeScript,
 * без нативних бінарників, працює напряму через `pg` (node-postgres).
 * API дуже схоже на Prisma (типобезпечні запити, схема як код), міграції
 * генеруються як звичайний SQL і застосовуються напряму через psql —
 * без жодних мережевих залежностей. При розгортанні на хостингу з
 * відкритим мережевим доступом команда може за бажанням мігрувати назад
 * на Prisma без зміни бізнес-логіки (шар доступу до даних ізольований
 * в lib/db).
 */

// ---------- Адміністратори ----------
export const adminUsers = pgTable("admin_users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  role: varchar("role", { length: 32 }).notNull().default("admin"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- AI моделі (з автоматичним фолбеком) ----------
export const aiModels = pgTable("ai_models", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  provider: varchar("provider", { length: 32 }).notNull(), // "openai" | "anthropic"
  model: varchar("model", { length: 128 }).notNull(), // e.g. gpt-4o-mini, claude-3-5-haiku
  apiKeyEnvVar: varchar("api_key_env_var", { length: 128 }).notNull(), // назва змінної в .env.local
  priority: integer("priority").notNull().default(0), // менше число = вищий пріоритет
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  inputCostPer1kTokens: doublePrecision("input_cost_per_1k").notNull().default(0),
  outputCostPer1kTokens: doublePrecision("output_cost_per_1k").notNull().default(0),
  systemPrompt: text("system_prompt"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Лог використання AI ----------
export const aiUsageLogs = pgTable("ai_usage_logs", {
  id: serial("id").primaryKey(),
  modelId: integer("model_id").references(() => aiModels.id, { onDelete: "set null" }),
  modelNameSnapshot: varchar("model_name_snapshot", { length: 128 }),
  status: varchar("status", { length: 16 }).notNull(), // "success" | "error" | "fallback" | "skipped" (немає ключа)
  errorMessage: text("error_message"),
  inputTokens: integer("input_tokens").notNull().default(0),
  outputTokens: integer("output_tokens").notNull().default(0),
  costUsd: doublePrecision("cost_usd").notNull().default(0),
  responseTimeMs: integer("response_time_ms").notNull().default(0),
  locale: varchar("locale", { length: 8 }),
  page: varchar("page", { length: 255 }),
  userMessage: text("user_message"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Послуги ----------
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  titleUk: varchar("title_uk", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull(),
  descriptionUk: text("description_uk").notNull().default(""),
  descriptionEn: text("description_en").notNull().default(""),
  price: doublePrecision("price").notNull().default(0),
  currency: varchar("currency", { length: 8 }).notNull().default("UAH"),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | draft | archived
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Опитування ----------
export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const surveyQuestions = pgTable("survey_questions", {
  id: serial("id").primaryKey(),
  surveyId: integer("survey_id")
    .references(() => surveys.id, { onDelete: "cascade" })
    .notNull(),
  text: text("text").notNull(),
  type: varchar("type", { length: 16 }).notNull().default("nps"), // nps | text | choice
  options: jsonb("options"), // для choice-питань
  order: integer("order").notNull().default(0),
});

export const surveyResponses = pgTable("survey_responses", {
  id: serial("id").primaryKey(),
  questionId: integer("question_id")
    .references(() => surveyQuestions.id, { onDelete: "cascade" })
    .notNull(),
  value: text("value").notNull(), // число (NPS), текст, або обраний варіант
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Компанія (для інвойсів) ----------
export const companyProfile = pgTable("company_profile", {
  id: serial("id").primaryKey(),
  legalName: varchar("legal_name", { length: 255 }).notNull().default("КНП «Центр енергоефективності»"),
  edrpou: varchar("edrpou", { length: 32 }).notNull().default(""),
  address: text("address").notNull().default("Ладижин, Вінницька обл."),
  iban: varchar("iban", { length: 64 }).notNull().default(""),
  bankName: varchar("bank_name", { length: 255 }).notNull().default(""),
  vatPayer: boolean("vat_payer").notNull().default(false),
  email: varchar("email", { length: 255 }).notNull().default(""),
  phone: varchar("phone", { length: 64 }).notNull().default(""),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Рахунки (інвойси) ----------
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  number: varchar("number", { length: 64 }).notNull().unique(),
  clientName: varchar("client_name", { length: 255 }).notNull(),
  clientDetails: text("client_details"),
  amount: doublePrecision("amount").notNull(),
  currency: varchar("currency", { length: 8 }).notNull().default("UAH"),
  status: varchar("status", { length: 16 }).notNull().default("draft"), // draft | sent | paid | overdue
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  dueAt: timestamp("due_at"),
  paidAt: timestamp("paid_at"),
  serviceDescription: text("service_description").notNull().default(""),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// ---------- Платіжні шлюзи (зберігаємо лише статус підключення, ключі — в .env) ----------
export const paymentGateways = pgTable("payment_gateways", {
  id: serial("id").primaryKey(),
  provider: varchar("provider", { length: 32 }).notNull().unique(), // wayforpay | liqpay | stripe | fondy
  isConnected: boolean("is_connected").notNull().default(false),
  apiKeyEnvVar: varchar("api_key_env_var", { length: 128 }),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Заявки (форма звернення + контакт із чату AI-помічника) ----------
export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 64 }),
  segment: varchar("segment", { length: 32 }), // osbb | business | community | citizen | developer | donor | other
  message: text("message").notNull().default(""),
  source: varchar("source", { length: 16 }).notNull().default("form"), // form | chat
  page: varchar("page", { length: 255 }), // сторінка, з якої надійшла заявка
  locale: varchar("locale", { length: 8 }),
  transcript: jsonb("transcript"), // для source=chat: масив {role, text}
  status: varchar("status", { length: 16 }).notNull().default("new"), // new | in_progress | done | spam
  adminNote: text("admin_note"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Блог ----------
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  titleUk: varchar("title_uk", { length: 255 }).notNull(),
  titleEn: varchar("title_en", { length: 255 }).notNull().default(""),
  excerptUk: text("excerpt_uk").notNull().default(""),
  excerptEn: text("excerpt_en").notNull().default(""),
  bodyUk: text("body_uk").notNull().default(""), // Markdown
  bodyEn: text("body_en").notNull().default(""), // Markdown
  tag: varchar("tag", { length: 64 }), // короткий маркер теми
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// =====================================================================
//  БАЗА ЗНАНЬ: користувачі, документи, джерела новин, дайджести, метеринг
// =====================================================================

// ---------- Публічні користувачі (не адміни) ----------
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }),
  organization: varchar("organization", { length: 255 }),
  plan: varchar("plan", { length: 16 }).notNull().default("free"), // free | premium | enterprise
  planUntil: timestamp("plan_until"), // null = безстроково / не застосовно
  locale: varchar("locale", { length: 8 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastLoginAt: timestamp("last_login_at"),
});

// ---------- Нормативна і технічна документація ----------
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  kind: varchar("kind", { length: 24 }).notNull(), // law | resolution | regulator | dbn | dstu | iso | eu | other
  number: varchar("number", { length: 64 }), // «2019-VIII», «310»
  title: varchar("title", { length: 500 }).notNull(),
  issuer: varchar("issuer", { length: 255 }), // ВРУ, КМУ, НКРЕКП, Мінрегіон…
  adoptedAt: timestamp("adopted_at"),
  status: varchar("status", { length: 16 }).notNull().default("active"), // active | amended | repealed | draft
  summary: text("summary").notNull().default(""), // Markdown: про що документ, кому важливий
  keyPoints: jsonb("key_points"), // string[]
  tags: jsonb("tags"), // string[]
  sourceUrl: varchar("source_url", { length: 500 }), // першоджерело (zakon.rada.gov.ua тощо)
  checkedAt: timestamp("checked_at"), // коли фахівець Центру звіряв
  published: boolean("published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Журнал змін документа — «постійне оновлення» видиме користувачу
export const documentUpdates = pgTable("document_updates", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").references(() => documents.id, { onDelete: "cascade" }).notNull(),
  date: timestamp("date").notNull().defaultNow(),
  note: text("note").notNull(), // що змінилось
  sourceUrl: varchar("source_url", { length: 500 }),
});

// ---------- Джерела новин (RSS) ----------
export const sources = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 160 }).notNull(),
  url: varchar("url", { length: 500 }).notNull().unique(),
  kind: varchar("kind", { length: 24 }).notNull().default("rss"), // rss
  category: varchar("category", { length: 32 }), // regulator | government | operator | market | media | local
  enabled: boolean("enabled").notNull().default(false),
  lastFetchedAt: timestamp("last_fetched_at"),
  lastStatus: varchar("last_status", { length: 255 }), // «OK, 24 items» або текст помилки
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const newsItems = pgTable("news_items", {
  id: serial("id").primaryKey(),
  sourceId: integer("source_id").references(() => sources.id, { onDelete: "cascade" }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  url: varchar("url", { length: 800 }).notNull().unique(),
  publishedAt: timestamp("published_at"),
  summary: text("summary"), // короткий опис з RSS (очищений від HTML)
  fetchedAt: timestamp("fetched_at").notNull().defaultNow(),
  digestId: integer("digest_id"), // у який дайджест увійшла
});

// ---------- Дайджести ----------
export const digests = pgTable("digests", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 160 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  periodFrom: timestamp("period_from"),
  periodTo: timestamp("period_to"),
  kind: varchar("kind", { length: 16 }).notNull().default("energy"), // energy | local (місцеві новини)
  intro: text("intro").notNull().default(""),
  body: text("body").notNull().default(""), // Markdown
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ---------- Метеринг запитів до AI-консультації ----------
export const usageEvents = pgTable("usage_events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  anonKey: varchar("anon_key", { length: 128 }), // хеш cookie+IP для гостей
  kind: varchar("kind", { length: 24 }).notNull().default("ask"),
  question: text("question"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
