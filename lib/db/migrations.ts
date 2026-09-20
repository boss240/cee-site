import { sql } from "drizzle-orm";
import { db } from "./index";

/**
 * Початкова схема БД (згенеровано drizzle-kit generate з lib/db/schema.ts, файл drizzle/0000_init.sql).
 * Вбудована в код, щоб /api/setup міг створити таблиці на хостингу (Vercel + Neon)
 * без доступу до консолі. Для наступних змін схеми: drizzle-kit generate → додати новий
 * блок у MIGRATIONS з новим id.
 */
const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "0000_init",
    sql: String.raw`CREATE TABLE "admin_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255),
	"role" varchar(32) DEFAULT 'admin' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "admin_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "ai_models" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(128) NOT NULL,
	"provider" varchar(32) NOT NULL,
	"model" varchar(128) NOT NULL,
	"api_key_env_var" varchar(128) NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"is_default" boolean DEFAULT false NOT NULL,
	"input_cost_per_1k" double precision DEFAULT 0 NOT NULL,
	"output_cost_per_1k" double precision DEFAULT 0 NOT NULL,
	"system_prompt" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_usage_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"model_id" integer,
	"model_name_snapshot" varchar(128),
	"status" varchar(16) NOT NULL,
	"error_message" text,
	"input_tokens" integer DEFAULT 0 NOT NULL,
	"output_tokens" integer DEFAULT 0 NOT NULL,
	"cost_usd" double precision DEFAULT 0 NOT NULL,
	"response_time_ms" integer DEFAULT 0 NOT NULL,
	"locale" varchar(8),
	"page" varchar(255),
	"user_message" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "company_profile" (
	"id" serial PRIMARY KEY NOT NULL,
	"legal_name" varchar(255) DEFAULT 'КНП «Центр енергоефективності»' NOT NULL,
	"edrpou" varchar(32) DEFAULT '' NOT NULL,
	"address" text DEFAULT 'Ладижин, Вінницька обл.' NOT NULL,
	"iban" varchar(64) DEFAULT '' NOT NULL,
	"bank_name" varchar(255) DEFAULT '' NOT NULL,
	"vat_payer" boolean DEFAULT false NOT NULL,
	"email" varchar(255) DEFAULT '' NOT NULL,
	"phone" varchar(64) DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "digests" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(255) NOT NULL,
	"period_from" timestamp,
	"period_to" timestamp,
	"intro" text DEFAULT '' NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "digests_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "document_updates" (
	"id" serial PRIMARY KEY NOT NULL,
	"document_id" integer NOT NULL,
	"date" timestamp DEFAULT now() NOT NULL,
	"note" text NOT NULL,
	"source_url" varchar(500)
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"kind" varchar(24) NOT NULL,
	"number" varchar(64),
	"title" varchar(500) NOT NULL,
	"issuer" varchar(255),
	"adopted_at" timestamp,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"key_points" jsonb,
	"tags" jsonb,
	"source_url" varchar(500),
	"checked_at" timestamp,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "documents_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"number" varchar(64) NOT NULL,
	"client_name" varchar(255) NOT NULL,
	"client_details" text,
	"amount" double precision NOT NULL,
	"currency" varchar(8) DEFAULT 'UAH' NOT NULL,
	"status" varchar(16) DEFAULT 'draft' NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL,
	"due_at" timestamp,
	"paid_at" timestamp,
	"service_description" text DEFAULT '' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_number_unique" UNIQUE("number")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(64),
	"segment" varchar(32),
	"message" text DEFAULT '' NOT NULL,
	"source" varchar(16) DEFAULT 'form' NOT NULL,
	"page" varchar(255),
	"locale" varchar(8),
	"transcript" jsonb,
	"status" varchar(16) DEFAULT 'new' NOT NULL,
	"admin_note" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "news_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"source_id" integer NOT NULL,
	"title" varchar(500) NOT NULL,
	"url" varchar(800) NOT NULL,
	"published_at" timestamp,
	"summary" text,
	"fetched_at" timestamp DEFAULT now() NOT NULL,
	"digest_id" integer,
	CONSTRAINT "news_items_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "payment_gateways" (
	"id" serial PRIMARY KEY NOT NULL,
	"provider" varchar(32) NOT NULL,
	"is_connected" boolean DEFAULT false NOT NULL,
	"api_key_env_var" varchar(128),
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payment_gateways_provider_unique" UNIQUE("provider")
);
--> statement-breakpoint
CREATE TABLE "posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title_uk" varchar(255) NOT NULL,
	"title_en" varchar(255) DEFAULT '' NOT NULL,
	"excerpt_uk" text DEFAULT '' NOT NULL,
	"excerpt_en" text DEFAULT '' NOT NULL,
	"body_uk" text DEFAULT '' NOT NULL,
	"body_en" text DEFAULT '' NOT NULL,
	"tag" varchar(64),
	"published" boolean DEFAULT false NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "posts_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"title_uk" varchar(255) NOT NULL,
	"title_en" varchar(255) NOT NULL,
	"description_uk" text DEFAULT '' NOT NULL,
	"description_en" text DEFAULT '' NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"currency" varchar(8) DEFAULT 'UAH' NOT NULL,
	"status" varchar(16) DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sources" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(160) NOT NULL,
	"url" varchar(500) NOT NULL,
	"kind" varchar(24) DEFAULT 'rss' NOT NULL,
	"category" varchar(32),
	"enabled" boolean DEFAULT false NOT NULL,
	"last_fetched_at" timestamp,
	"last_status" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sources_url_unique" UNIQUE("url")
);
--> statement-breakpoint
CREATE TABLE "survey_questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"survey_id" integer NOT NULL,
	"text" text NOT NULL,
	"type" varchar(16) DEFAULT 'nps' NOT NULL,
	"options" jsonb,
	"order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "survey_responses" (
	"id" serial PRIMARY KEY NOT NULL,
	"question_id" integer NOT NULL,
	"value" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "surveys" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "usage_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"anon_key" varchar(128),
	"kind" varchar(24) DEFAULT 'ask' NOT NULL,
	"question" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(255),
	"organization" varchar(255),
	"plan" varchar(16) DEFAULT 'free' NOT NULL,
	"plan_until" timestamp,
	"locale" varchar(8),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"last_login_at" timestamp,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_usage_logs" ADD CONSTRAINT "ai_usage_logs_model_id_ai_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."ai_models"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "document_updates" ADD CONSTRAINT "document_updates_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_source_id_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."sources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_questions" ADD CONSTRAINT "survey_questions_survey_id_surveys_id_fk" FOREIGN KEY ("survey_id") REFERENCES "public"."surveys"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "survey_responses" ADD CONSTRAINT "survey_responses_question_id_survey_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."survey_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "usage_events" ADD CONSTRAINT "usage_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;`,
  },
];

/** Застосовує ще не застосовані міграції. Повертає список застосованих id. */
export async function runMigrations(): Promise<string[]> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "__cee_migrations" ("id" text PRIMARY KEY, "applied_at" timestamp DEFAULT now() NOT NULL)`);
  const done = await db.execute(sql`SELECT "id" FROM "__cee_migrations"`);
  const doneIds = new Set((done.rows as { id: string }[]).map((r) => r.id));
  const applied: string[] = [];
  for (const m of MIGRATIONS) {
    if (doneIds.has(m.id)) continue;
    const statements = m.sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    await db.transaction(async (tx) => {
      for (const st of statements) await tx.execute(sql.raw(st));
      await tx.execute(sql`INSERT INTO "__cee_migrations" ("id") VALUES (${m.id})`);
    });
    applied.push(m.id);
  }
  return applied;
}
