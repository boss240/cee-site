/**
 * Наповнення БД початковими даними: перший адмін, дефолтні AI-моделі
 * (з пріоритетом для фолбеку), профіль компанії, платіжні шлюзи, приклади
 * послуг. Запуск: npm run db:seed або POST /api/setup (на хостингу, з SETUP_TOKEN).
 */
import bcrypt from "bcryptjs";
import { db, schema } from "./index";
import { eq } from "drizzle-orm";
import { SEED_POSTS } from "./seedPosts";
import { SEED_DOCUMENTS } from "./seedDocuments";
import { SEED_SOURCES, SEED_DIGEST } from "./seedKnowledge";

export async function seedDatabase(): Promise<string[]> {
  const log: string[] = [];
  const adminEmail = process.env.SEED_ADMIN_EMAIL || "admin@cee.org.ua";
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

  const existingAdmin = await db
    .select()
    .from(schema.adminUsers)
    .where(eq(schema.adminUsers.email, adminEmail));

  if (existingAdmin.length === 0) {
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    await db.insert(schema.adminUsers).values({
      email: adminEmail,
      passwordHash,
      name: "Адміністратор",
      role: "admin",
    });
    log.push(`✓ Створено адміна: ${adminEmail} (пароль зі змінної SEED_ADMIN_PASSWORD)`);
  } else {
    log.push(`• Адмін ${adminEmail} вже існує, пропускаю`);
  }

  const existingModels = await db.select().from(schema.aiModels);
  if (existingModels.length === 0) {
    await db.insert(schema.aiModels).values([
      {
        name: "OpenAI GPT-4o mini (основна)",
        provider: "openai",
        model: "gpt-4o-mini",
        apiKeyEnvVar: "OPENAI_API_KEY",
        priority: 0,
        isActive: true,
        isDefault: true,
        inputCostPer1kTokens: 0.00015,
        outputCostPer1kTokens: 0.0006,
        systemPrompt:
          "Ти — AI-помічник сайту Центру енергоефективності (ЦЕЕ) у Ладижині. Відповідай коротко, по суті, українською або англійською залежно від мови користувача.",
      },
      {
        name: "Anthropic Claude Haiku (резервна)",
        provider: "anthropic",
        model: "claude-3-5-haiku-20241022",
        apiKeyEnvVar: "ANTHROPIC_API_KEY",
        priority: 1,
        isActive: true,
        isDefault: false,
        inputCostPer1kTokens: 0.0008,
        outputCostPer1kTokens: 0.004,
        systemPrompt:
          "Ти — AI-помічник сайту Центру енергоефективності (ЦЕЕ) у Ладижині. Відповідай коротко, по суті, українською або англійською залежно від мови користувача.",
      },
    ]);
    log.push("✓ Додано 2 дефолтні AI-моделі (основна + резервна)");
  } else {
    log.push("• AI-моделі вже існують, пропускаю");
  }

  const existingCompany = await db.select().from(schema.companyProfile);
  if (existingCompany.length === 0) {
    await db.insert(schema.companyProfile).values({});
    log.push("✓ Створено профіль компанії за замовчуванням");
  }

  const existingGateways = await db.select().from(schema.paymentGateways);
  if (existingGateways.length === 0) {
    await db.insert(schema.paymentGateways).values([
      { provider: "wayforpay", isConnected: false, apiKeyEnvVar: "WAYFORPAY_API_KEY" },
      { provider: "liqpay", isConnected: false, apiKeyEnvVar: "LIQPAY_API_KEY" },
      { provider: "stripe", isConnected: false, apiKeyEnvVar: "STRIPE_API_KEY" },
      { provider: "fondy", isConnected: false, apiKeyEnvVar: "FONDY_API_KEY" },
    ]);
    log.push("✓ Додано 4 платіжні шлюзи (не підключені)");
  }

  const existingServices = await db.select().from(schema.services);
  if (existingServices.length === 0) {
    await db.insert(schema.services).values([
      {
        titleUk: "Енергоаудит багатоквартирного будинку",
        titleEn: "Energy audit of an apartment building",
        descriptionUk: "Повний енергетичний аудит будівлі з рекомендаціями щодо модернізації.",
        descriptionEn: "Full building energy audit with modernization recommendations.",
        price: 15000,
        currency: "UAH",
        status: "active",
      },
      {
        titleUk: "Супровід заявки на програму «Енергодім»",
        titleEn: "Support for an Energodim program application",
        descriptionUk: "Підготовка документів і супровід ОСББ на всіх етапах програми.",
        descriptionEn: "Document preparation and support for HOAs through the whole program.",
        price: 5000,
        currency: "UAH",
        status: "active",
      },
    ]);
    log.push("✓ Додано 2 приклади послуг");
  }

    const existingPosts = await db.select({ id: schema.posts.id }).from(schema.posts).limit(1);
  if (existingPosts.length === 0) {
    const base = Date.now();
    await db.insert(schema.posts).values(
      SEED_POSTS.map((p, i) => ({
        ...p,
        published: true,
        // публікуємо з різними датами, щоб список не виглядав як «усе в один день»
        publishedAt: new Date(base - (SEED_POSTS.length - i) * 7 * 24 * 3600 * 1000),
      }))
    );
    log.push(`✓ Додано ${SEED_POSTS.length} статей блогу`);
  } else {
    log.push("• Статті блогу вже є, пропускаю");
  }

    const existingDocs = await db.select({ id: schema.documents.id }).from(schema.documents).limit(1);
  if (existingDocs.length === 0) {
    const checkedAt = new Date();
    await db.insert(schema.documents).values(SEED_DOCUMENTS.map((doc) => ({ ...doc, published: true, checkedAt })));
    log.push(`✓ Додано ${SEED_DOCUMENTS.length} документів до бази знань`);
  } else {
    log.push("• Документи бази знань уже є, пропускаю");
  }

  const existingSources = await db.select({ id: schema.sources.id }).from(schema.sources).limit(1);
  if (existingSources.length === 0) {
    await db.insert(schema.sources).values(SEED_SOURCES);
    log.push(`✓ Додано ${SEED_SOURCES.length} джерел новин (вимкнені до перевірки)`);
  } else {
    log.push("• Джерела новин уже є, пропускаю");
  }

  const existingDigests = await db.select({ id: schema.digests.id }).from(schema.digests).limit(1);
  if (existingDigests.length === 0) {
    await db.insert(schema.digests).values({ ...SEED_DIGEST, published: true, publishedAt: new Date() });
    log.push("✓ Додано вступний дайджест");
  } else {
    log.push("• Дайджести вже є, пропускаю");
  }

  log.push("Готово.");
  return log;
}

