import { primaryFailure } from "@/lib/assistant/primaryFailure";
import { backupConfiguration } from "@/lib/assistant/backupConfiguration";
import { approvedModel } from "@/lib/assistant/modelPolicy";
import { generateText } from "ai";
import { AI_BUDGET, reserveAICall, settleAICall } from "@/lib/ai-budget";
import { createOpenAI } from "@ai-sdk/openai";
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
  fallbackReason?: "runtime_unavailable" | "database_unavailable" | "no_active_models" | "models_unavailable";
};

class EmptyAIResponseError extends Error {}
class AIBudgetDeniedError extends Error {}
class AIInputLimitError extends Error {}

/** Persist only an allowlisted category: SDK errors can contain response/request data. */
function safeAIError(error: unknown, httpStatus: number | null = null): string {
  if (error instanceof AIBudgetDeniedError) return "budget_unavailable";
  if (error instanceof AIInputLimitError) return "input_limit";
  if (error instanceof EmptyAIResponseError) return "empty_response";
  if (error && typeof error === "object") {
    const info = error as { name?: unknown };
    if (info.name === "AbortError" || info.name === "TimeoutError") return "provider_timeout";
    if (httpStatus === 402) return "provider_credits_unavailable";
    if (httpStatus === 401 || httpStatus === 403) return "provider_auth_error";
    if (httpStatus === 429) return "provider_rate_limited";
  }
  return "provider_error";
}

type ProviderAttempt = { provider: "openai" | "anthropic" | "openrouter" | "unknown"; httpStatus: number | null; reservation: string | null; fetchSequence: number };
function newAttempt(provider: string): ProviderAttempt {
  return { provider: provider === "openai" || provider === "anthropic" || provider === "openrouter" ? provider : "unknown", httpStatus: null, reservation: null, fetchSequence: 0 };
}

const SAFE_PROVIDER_CODES = new Set([
  "rate_limit_exceeded", "insufficient_quota", "invalid_api_key", "model_not_found",
  "context_length_exceeded", "content_filter", "server_error",
  "invalid_prompt", "image_content_policy_violation", "permission_denied",
]);
function safeProviderCode(error: unknown): string | null {
  if (error === undefined) return null;
  if (!error || typeof error !== "object") return "unknown";
  const info = error as { code?: unknown; data?: unknown; responseBody?: unknown };
  const allowed = (value: unknown): value is string => typeof value === "string" && SAFE_PROVIDER_CODES.has(value);
  if (allowed(info.code)) return info.code;
  const nestedCode = (value: unknown): unknown => {
    if (!value || typeof value !== "object" || !("error" in value)) return undefined;
    const nested = value.error;
    return nested && typeof nested === "object" && "code" in nested ? nested.code : undefined;
  };
  const dataCode = nestedCode(info.data);
  if (allowed(dataCode)) return dataCode;
  const responseCode = nestedCode(info.responseBody);
  if (allowed(responseCode)) return responseCode;
  // Parse only an already-buffered, bounded SDK error body; never clone/read a response stream.
  if (typeof info.responseBody === "string" && info.responseBody.length <= 8192) {
    try {
      const code = nestedCode(JSON.parse(info.responseBody));
      if (allowed(code)) return code;
    } catch { /* Malformed/unknown body is not diagnostic output. */ }
  }
  return "unknown";
}

/** No model IDs, request text, URLs, headers, raw responses or raw error strings. */
function logAttempt(event: "ai_attempt_started" | "ai_attempt_completed" | "ai_provider_http_response" | "ai_provider_http_error", reservation: string,
  attempt: ProviderAttempt, outcome: string | null, error?: unknown) {
  try {
    console.info(JSON.stringify({ event, reservation, provider: attempt.provider,
      observedHttpStatus: attempt.httpStatus, fetchSequence: attempt.fetchSequence, outcome, providerCode: safeProviderCode(error) }));
  } catch {
    // Telemetry failure never creates a second provider attempt.
  }
}

function buildProviderModel(provider: string, modelId: string, apiKey: string, attempt: ProviderAttempt) {
  const observedFetch: typeof fetch = async (input, init) => {
    attempt.fetchSequence += 1;
    attempt.httpStatus = null;
    try {
      const response = await fetch(input, init);
      // SDK error.statusCode can be synthesized after HTTP200: record transport only.
      attempt.httpStatus = Number.isInteger(response.status) && response.status >= 100 && response.status <= 599 ? response.status : null;
      if (attempt.reservation) logAttempt("ai_provider_http_response", attempt.reservation, attempt, null);
      return response;
    } catch (error) {
      if (attempt.reservation) logAttempt("ai_provider_http_error", attempt.reservation, attempt, "network_error");
      // Preserve the SDK's control flow while exposing no request/response details.
      throw error;
    }
  };
  if (provider === "openrouter") {
    // OpenRouter реалізує OpenAI-сумісний протокол — той самий клієнт @ai-sdk/openai,
    // лише з іншим baseURL і атрибуційними заголовками (потрібні OpenRouter для
    // показу трафіку сайту в його власному дашборді витрат).
    const client = createOpenAI({
      apiKey,
      fetch: observedFetch,
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        "HTTP-Referer": "https://cee.energy",
        "X-Title": "CEE Energy - AI Assistant",
      },
    });
    return client(modelId);
  }
  throw new Error(`Невідомий провайдер AI: ${provider}`);
}

/** Single paid attempt: no SDK retries or model retry after invocation.
 * Rejected SDK promise keeps its durable slot: remote settlement can be unknown.
 */
async function generateReserved(opts: {
  model: ReturnType<typeof buildProviderModel>;
  attempt: ProviderAttempt;
  system?: string;
  prompt?: string;
  messages?: { role: "user" | "assistant"; content: string }[];
  maxOutputTokens: number;
  timeoutMs: number;
}) {
  const parts = [opts.system ?? "", opts.prompt ?? "", ...(opts.messages ?? []).map(m => m.content)];
  if (parts.some(p => typeof p !== "string") ||
      parts.reduce((sum, p) => sum + Buffer.byteLength(p, "utf8"), 0) > AI_BUDGET.maxInputBytes ||
      !Number.isInteger(opts.maxOutputTokens) || opts.maxOutputTokens < 1 || opts.maxOutputTokens > AI_BUDGET.maxOutputTokens ||
      !Number.isInteger(opts.timeoutMs) || opts.timeoutMs < 1 || opts.timeoutMs > AI_BUDGET.maxTimeoutMs) {
    throw new AIInputLimitError();
  }
  const reservation = await reserveAICall();
  if (!reservation) throw new AIBudgetDeniedError();
  opts.attempt.reservation = reservation;
  logAttempt("ai_attempt_started", reservation, opts.attempt, null);
  try {
    const result = await generateText({
      model: opts.model, system: opts.system,
      ...(opts.messages ? { messages: opts.messages } : { prompt: opts.prompt ?? "" }),
      maxOutputTokens: opts.maxOutputTokens, maxRetries: 0,
      // Explicit stateless intent for OpenRouter Responses; not a claim about previous defaults.
      providerOptions: opts.attempt.provider === "openrouter" ? { openai: { store: false } } : undefined,
      abortSignal: AbortSignal.timeout(opts.timeoutMs),
    });
    logAttempt("ai_attempt_completed", reservation, opts.attempt, result.text?.trim() ? "success" : "empty_response");
    await settleAICall(reservation);
    return result;
  } catch (error) {
    logAttempt("ai_attempt_completed", reservation, opts.attempt, safeAIError(error, opts.attempt.httpStatus), error);
    // Rejected/unknown provider work retains its durable slot; never retry or refund.
    throw error;
  }
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
      userMessage: null, // New records never persist prompts; historical data is untouched.
    });
  } catch {
    // Логування не повинно ламати відповідь користувачу навіть якщо БД недоступна.
  }
}

/** Select the first configured active model. Missing credentials can be skipped
 * without network work. At most one reserved SDK invocation per logical call;
 * empty/error/unknown outcomes use local reference, never another paid attempt.
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
  const backupEnabled = backupConfiguration(process.env).enabled;
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
      .orderBy(schema.aiModels.priority, schema.aiModels.id);
  } catch {
    // БД недоступна — одразу база знань.
    const { answer } = answerFromKnowledgeBase(message, locale);
    console.warn(JSON.stringify({ event: "assistant_fallback", reason: "database_unavailable" }));
    return { reply: answer, source: "knowledge-base", fallbackReason: "database_unavailable" };
  }

  for (const model of models) {
    if (!approvedModel(model)) continue;
    const apiKey = process.env.OPENROUTER_API_KEY_CEE;
    if (!apiKey) {
      // Не помилка, а конфігурація: ключ ще не задано. Не лякаємо дашборд червоним.
      await logUsage({
        modelId: model.id,
        modelNameSnapshot: model.name,
        status: "skipped",
        errorMessage: "missing_credential",
        responseTimeMs: 0,
        locale,
        page,
        userMessage: message,
      });
      continue;
    }

    const startedAt = Date.now();
    const attempt = newAttempt(model.provider);
    try {
      const languageModel = buildProviderModel(model.provider, model.model, apiKey, attempt);
      const result = await generateReserved({
        model: languageModel, attempt,
        system: model.systemPrompt ? `${siteSystem}\n\nДОДАТКОВО ВІД АДМІНІСТРАТОРА\n${model.systemPrompt}` : siteSystem,
        messages: [...priorTurns, { role: "user" as const, content: message }],
        maxOutputTokens: 1500,
        timeoutMs: backupEnabled ? 8_000 : AI_BUDGET.maxTimeoutMs,
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
        status: result.text?.trim() ? "success" : "error",
        errorMessage: result.text?.trim() ? undefined : "empty_response",
        inputTokens,
        outputTokens,
        costUsd,
        responseTimeMs,
        locale,
        page,
        userMessage: message,
      });

      if (!result.text?.trim()) break;
      return { reply: result.text.trim(), source: "ai", modelName: model.name };
    } catch (err) {
      const responseTimeMs = Date.now() - startedAt;
      await logUsage({
        modelId: model.id,
        modelNameSnapshot: model.name,
        status: "error",
        errorMessage: safeAIError(err, attempt.httpStatus),
        responseTimeMs,
        locale,
        page,
        userMessage: message,
      });
      // Backups are explicitly server-enabled only, and only for an actual primary
      // invocation. Input/quota/schema failures never authorize another provider.
      if (backupEnabled && attempt.reservation && !(err instanceof AIInputLimitError) && !(err instanceof AIBudgetDeniedError)) {
        try {
          const { backupAfterPrimaryFailure } = await import("@/lib/assistant/backupFallback");
          const context = JSON.stringify({
            system: model.systemPrompt ? `${siteSystem}\n\n${model.systemPrompt}` : siteSystem,
            messages: [...priorTurns, { role: "user", content: message }],
          });
          const failure = primaryFailure(err, attempt.httpStatus);
          // Documented pre-dispatch HTTP402 only: release concurrency, NOT the
          // rolling attempt charge. Unknown outcomes never reach this branch.
          if (failure.workNotStarted === true) await settleAICall(attempt.reservation);
          const backup = await backupAfterPrimaryFailure(context,
            failure,
            Math.max(0, AI_BUDGET.maxTimeoutMs - (Date.now() - startedAt)));
          if (backup) return { reply: backup.text, source: "ai", modelName: backup.modelName };
        } catch { /* No retry, key disclosure or loss of the existing local reference. */ }
      }
      break;
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
  return { reply: answer, source: "knowledge-base", fallbackReason: models.length ? "models_unavailable" : "no_active_models" };
}

/** Використовується кнопкою "Перевірити з'єднання" в адмінці. */
export async function testModelConnection(model: {
  provider: string;
  model: string;
  apiKeyEnvVar: string;
}): Promise<{ ok: boolean; message: string; responseTimeMs: number }> {
  if (!approvedModel(model)) return { ok: false, message: "provider_configuration_not_allowed", responseTimeMs: 0 };
  const apiKey = process.env.OPENROUTER_API_KEY_CEE;
  if (!apiKey) {
    return { ok: false, message: "missing_credential", responseTimeMs: 0 };
  }
  const startedAt = Date.now();
  const attempt = newAttempt(model.provider);
  try {
    const languageModel = buildProviderModel(model.provider, model.model, apiKey, attempt);
    const result = await generateReserved({
      model: languageModel, attempt,
      prompt: "Say OK",
      maxOutputTokens: 64,
      timeoutMs: 10000,
    });
    if (!result.text?.trim()) throw new EmptyAIResponseError();
    return { ok: true, message: "OK", responseTimeMs: Date.now() - startedAt };
  } catch (err) {
    return {
      ok: false,
      message: safeAIError(err, attempt.httpStatus),
      responseTimeMs: Date.now() - startedAt,
    };
  }
}

/**
 * Універсальний виклик LLM для бази знань (консультації по документах,
 * чернетки дайджестів). Використовує ті самі активні моделі й один зарезервований виклик,
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
    models = await db.select().from(schema.aiModels).where(eq(schema.aiModels.isActive, true)).orderBy(schema.aiModels.priority, schema.aiModels.id);
  } catch {
    return null;
  }
  for (const model of models) {
    if (!approvedModel(model)) continue;
    const apiKey = process.env.OPENROUTER_API_KEY_CEE;
    if (!apiKey) {
      await logUsage({ modelId: model.id, modelNameSnapshot: model.name, status: "skipped", errorMessage: "missing_credential", responseTimeMs: 0, locale: opts.locale, page: opts.page, userMessage: opts.prompt });
      continue;
    }
    const startedAt = Date.now();
    const attempt = newAttempt(model.provider);
    try {
      const result = await generateReserved({
        model: buildProviderModel(model.provider, model.model, apiKey, attempt), attempt,
        system: opts.system,
        prompt: opts.prompt,
        maxOutputTokens: opts.maxTokens ?? 1500,
        timeoutMs: opts.timeoutMs ?? AI_BUDGET.maxTimeoutMs,
      });
      const inputTokens = result.usage?.inputTokens ?? 0;
      const outputTokens = result.usage?.outputTokens ?? 0;
      await logUsage({
        modelId: model.id, modelNameSnapshot: model.name, status: result.text?.trim() ? "success" : "error",
        errorMessage: result.text?.trim() ? undefined : "empty_response", inputTokens, outputTokens,
        costUsd: estimateCost(inputTokens, outputTokens, model.inputCostPer1kTokens, model.outputCostPer1kTokens),
        responseTimeMs: Date.now() - startedAt, locale: opts.locale, page: opts.page, userMessage: opts.prompt,
      });
      if (!result.text?.trim()) break;
      return { text: result.text.trim(), modelName: model.name };
    } catch (err) {
      await logUsage({ modelId: model.id, modelNameSnapshot: model.name, status: "error", errorMessage: safeAIError(err, attempt.httpStatus), responseTimeMs: Date.now() - startedAt, locale: opts.locale, page: opts.page, userMessage: opts.prompt });
      break;
    }
  }
  return null;
}
