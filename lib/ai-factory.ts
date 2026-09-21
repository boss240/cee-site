import { generateText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { answerFromKnowledgeBase } from "@/lib/knowledgeBase";
import { buildSystemPrompt } from "@/lib/assistant/siteContext";

export type ChatTurn = { role: "user" | "assistant"; text: string };

type Locale = "uk" | "en";

export type ChatResult = {
  reply: string;
  source: "ai" | "knowledge-base";
  modelName?: string;
};

function buildProviderModel(provider: string, modelId: string, apiKey: string) {
  if (provider === "openai") {
    const client = createOpenAI({ apiKey });
    return client(modelId);
  }
  if (provider === "anthropic") {
    const client = createAnthropic({ apiKey });
    return client(modelId);
  }
  if (provider === "openrouter") {
    // OpenRouter реалізує OpenAI-сумісний протокол — той самий клієнт @ai-sdk/openai,
    // лише з іншим baseURL і атрибуційними заголовками (потрібні OpenRouter для
    // показу трафіку сайту в його власному дашборді витрат).
    const client = createOpenAI({
      apiKey,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": "https://cee.energy",
        "X-Title": "CEE Energy — AI Assistant",
      },
    });
    return client(modelId);
  }
  throw new Error(`Невідомий провайдер AI: ${provider}`);
}

/** Приблизна вартість запиту в USD за таблицею ціни моделі (за 1K токенів). */
function estimateCost(
  inputTokens: number,
  outputTokens: number,
  inputCostPer1k: number,
  outputCostPer1k: number
) {
  return (inputTokens / 1000) * inputCostPer1k + (outputTokens / 1000) * outputCostPer1k;
}

async function logUsage(entry: {
  modelId: number | null;
  modelNameSnapshot: string | null;
  status: "success" | "error" | "fallback" | "skipped";
  errorMessage?: string;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  responseTimeMs: number;
  locale: Locale;
  page?: string;
  userMessage: string;
}) {
  try {
    await db.insert(schema.aiUsageLogs).values({
      modelId: entry.modelId,
      modelNameSnapshot: entry.modelNameSnapshot,
      status: entry.status,
      errorMessage: entry.errorMessage,
      inputTokens: entry.inputTokens ?? 0,
      outputTokens: entry.outputTokens ?? 0,
      costUsd: entry.costUsd ?? 0,
      responseTimeMs: entry.responseTimeMs,
      locale: entry.locale,
      page: entry.page,
      userMessage: entry.userMessage.slice(0, 2000),
    });
  } catch {
    // Логування не повинно ламати відповідь користувачу навіть якщо БД недоступна.
  }
}

/**
 * Головна точка входу AI-помічника: багатомодельний фактор з автоматичним
 * і непомітним для користувача фолбеком.
 *
 * Порядок:
 * 1. Читаємо активні моделі з БД, відсортовані за priority (0 = найвищий).
 * 2. Для кожної моделі по черзі: якщо немає ключа в env — пропускаємо
 *    (лог "error", без звернення в мережу), інакше викликаємо провайдера.
 *    Перша успішна відповідь повертається одразу.
 * 3. Якщо ВСІ моделі недоступні/вимкнені/без ключів — тихо переходимо на
 *    локальну базу знань (lib/knowledgeBase.ts), яка завжди відповідає.
 *
 * Це реалізує вимогу ТЗ: "вимкнення основної моделі в адмінці має призвести
 * до автоматичного і непомітного переключення на резервну".
 */
export async function getAssistantReply(
  message: string,
  locale: Locale,
  page?: string,
  history: ChatTurn[] = []
): Promise<ChatResult> {
  // Системний промпт збирається з живих текстів сайту + необов'язкове
  // доповнення з адмінки (model.systemPrompt) — щоб адміністратор міг
  // підкрутити тон, не втрачаючи фактичного контексту.
  const siteSystem = buildSystemPrompt(locale, page);
  // Останні репліки діалогу (без поточного повідомлення), обрізані для економії токенів.
  const priorTurns = history.slice(-10).map((t) => ({
    role: t.role,
    content: t.text.slice(0, 1500),
  }));

  let models: (typeof schema.aiModels.$inferSelect)[] = [];
  try {
    models = await db
      .select()
      .from(schema.aiModels)
      .where(eq(schema.aiModels.isActive, true))
      .orderBy(schema.aiModels.priority);
  } catch {
    // БД недоступна — одразу база знань.
    const { answer, matched } = answerFromKnowledgeBase(message, locale);
    return { reply: matched ? answer : answer, source: "knowledge-base" };
  }

  for (const model of models) {
    const apiKey = process.env[model.apiKeyEnvVar];
    if (!apiKey) {
      // Не помилка, а конфігурація: ключ ще не задано. Не лякаємо дашборд червоним.
      await logUsage({
        modelId: model.id,
        modelNameSnapshot: model.name,
        status: "skipped",
        errorMessage: `Немає ключа в змінній середовища ${model.apiKeyEnvVar}`,
        responseTimeMs: 0,
        locale,
        page,
        userMessage: message,
      });
      continue;
    }

    const startedAt = Date.now();
    try {
      const languageModel = buildProviderModel(model.provider, model.model, apiKey);
      const result = await generateText({
        model: languageModel,
        system: model.systemPrompt ? `${siteSystem}\n\nДОДАТКОВО ВІД АДМІНІСТРАТОРА\n${model.systemPrompt}` : siteSystem,
        messages: [...priorTurns, { role: "user" as const, content: message }],
        abortSignal: AbortSignal.timeout(20000),
      });

      const responseTimeMs = Date.now() - startedAt;
      const inputTokens = result.usage?.inputTokens ?? 0;
      const outputTokens = result.usage?.outputTokens ?? 0;
      const costUsd = estimateCost(
        inputTokens,
        outputTokens,
        model.inputCostPer1kTokens,
        model.outputCostPer1kTokens
      );

      await logUsage({
        modelId: model.id,
        modelNameSnapshot: model.name,
        status: "success",
        inputTokens,
        outputTokens,
        costUsd,
        responseTimeMs,
        locale,
        page,
        userMessage: message,
      });

      return { reply: result.text, source: "ai", modelName: model.name };
    } catch (err) {
      const responseTimeMs = Date.now() - startedAt;
      await logUsage({
        modelId: model.id,
        modelNameSnapshot: model.name,
        status: "error",
        errorMessage: err instanceof Error ? err.message : String(err),
        responseTimeMs,
        locale,
        page,
        userMessage: message,
      });
      // Пробуємо наступну модель за пріоритетом.
    }
  }

  // Усі моделі недоступні — тихий фолбек на локальну базу знань.
  const { answer } = answerFromKnowledgeBase(message, locale);
  await logUsage({
    modelId: null,
    modelNameSnapshot: "knowledge-base-fallback",
    status: "fallback",
    responseTimeMs: 0,
    locale,
    page,
    userMessage: message,
  });
  return { reply: answer, source: "knowledge-base" };
}

/** Використовується кнопкою "Перевірити з'єднання" в адмінці. */
export async function testModelConnection(model: {
  provider: string;
  model: string;
  apiKeyEnvVar: string;
}): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
  const apiKey = process.env[model.apiKeyEnvVar];
  if (!apiKey) {
    return { ok: false, message: `Немає ключа в ${model.apiKeyEnvVar}`, responseTimeMs: 0 };
  }
  const startedAt = Date.now();
  try {
    const languageModel = buildProviderModel(model.provider, model.model, apiKey);
    await generateText({
      model: languageModel,
      prompt: "Say OK",
      abortSignal: AbortSignal.timeout(10000),
    });
    return { ok: true, message: "OK", responseTimeMs: Date.now() - startedAt };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : String(err),
      responseTimeMs: Date.now() - startedAt,
    };
  }
}

/**
 * Універсальний виклик LLM для бази знань (консультації по документах,
 * чернетки дайджестів). Використовує ті самі активні моделі й фолбек-ланцюг,
 * що й AI-помічник, але без «сайтового» системного промпту.
 * Повертає null, якщо жодна модель недоступна — виклик сам вирішує, що робити.
 */
export async function generateWithModels(opts: {
  system: string;
  prompt: string;
  locale: Locale;
  page?: string;
  maxTokens?: number;
  timeoutMs?: number;
}): Promise<{ text: string; modelName: string } | null> {
  let models: (typeof schema.aiModels.$inferSelect)[] = [];
  try {
    models = await db.select().from(schema.aiModels).where(eq(schema.aiModels.isActive, true)).orderBy(schema.aiModels.priority);
  } catch {
    return null;
  }
  for (const model of models) {
    const apiKey = process.env[model.apiKeyEnvVar];
    if (!apiKey) {
      await logUsage({ modelId: model.id, modelNameSnapshot: model.name, status: "skipped", errorMessage: `Немає ключа в змінній середовища ${model.apiKeyEnvVar}`, responseTimeMs: 0, locale: opts.locale, page: opts.page, userMessage: opts.prompt });
      continue;
    }
    const startedAt = Date.now();
    try {
      const result = await generateText({
        model: buildProviderModel(model.provider, model.model, apiKey),
        system: opts.system,
        prompt: opts.prompt,
        maxOutputTokens: opts.maxTokens ?? 1500,
        abortSignal: AbortSignal.timeout(opts.timeoutMs ?? 45000),
      });
      const inputTokens = result.usage?.inputTokens ?? 0;
      const outputTokens = result.usage?.outputTokens ?? 0;
      await logUsage({
        modelId: model.id, modelNameSnapshot: model.name, status: "success", inputTokens, outputTokens,
        costUsd: estimateCost(inputTokens, outputTokens, model.inputCostPer1kTokens, model.outputCostPer1kTokens),
        responseTimeMs: Date.now() - startedAt, locale: opts.locale, page: opts.page, userMessage: opts.prompt,
      });
      return { text: result.text, modelName: model.name };
    } catch (err) {
      await logUsage({ modelId: model.id, modelNameSnapshot: model.name, status: "error", errorMessage: err instanceof Error ? err.message : String(err), responseTimeMs: Date.now() - startedAt, locale: opts.locale, page: opts.page, userMessage: opts.prompt });
    }
  }
  return null;
}
