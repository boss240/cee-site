import { NextResponse } from "next/server";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { isEmailConfigured, isTelegramConfigured } from "@/lib/notify";
import { notifyRecipients } from "@/lib/notify/email";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  // Раніше тут була перевірка Boolean(process.env.OPENAI_API_KEY ||
  // process.env.ANTHROPIC_API_KEY) — захардкожена на два конкретні провайдери.
  // Після додавання OpenRouter (apiKeyEnvVar = OPENROUTER_API_KEY_CEE) вона
  // завжди показувала "не налаштовано", навіть коли AI реально відповідав.
  // Дивимось на apiKeyEnvVar активних моделей з БД — так само, як це робить
  // сам ai-factory.ts при виборі моделі.
  const activeModels = await db
    .select({ apiKeyEnvVar: schema.aiModels.apiKeyEnvVar })
    .from(schema.aiModels)
    .where(eq(schema.aiModels.isActive, true));
  const aiConfigured = activeModels.some((m) => Boolean(process.env[m.apiKeyEnvVar]));

  const [row] = await db
    .select({
      total: sql<number>`count(*) filter (where ${schema.aiUsageLogs.status} in ('success','fallback'))`,
      success: sql<number>`count(*) filter (where ${schema.aiUsageLogs.status} = 'success')`,
      fallback: sql<number>`count(*) filter (where ${schema.aiUsageLogs.status} = 'fallback')`,
      errors: sql<number>`count(*) filter (where ${schema.aiUsageLogs.status} = 'error')`,
      avgResponseMs: sql<number>`coalesce(avg(${schema.aiUsageLogs.responseTimeMs}) filter (where ${schema.aiUsageLogs.status} = 'success'), 0)`,
      totalCost: sql<number>`coalesce(sum(${schema.aiUsageLogs.costUsd}), 0)`,
    })
    .from(schema.aiUsageLogs);

  const [last24h] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.aiUsageLogs)
    .where(sql`${schema.aiUsageLogs.createdAt} > now() - interval '24 hours' and ${schema.aiUsageLogs.status} = 'error'`);

  const [leadsRow] = await db
    .select({
      total: sql<number>`count(*)`,
      fresh: sql<number>`count(*) filter (where ${schema.leads.status} = 'new')`,
    })
    .from(schema.leads);

  // Черга самонавчання бази знань: чернетки, які AI створив з реальних
  // питань відвідувачів (lib/knowledge/autoDraft.ts) і які ще чекають на
  // перевірку фахівцем у "Документи" — щоб вона не губилась поза очима.
  const [draftsRow] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.documents)
    .where(and(eq(schema.documents.aiDraft, true), eq(schema.documents.published, false)));

  return NextResponse.json({
    channels: {
      email: isEmailConfigured(),
      emailRecipients: notifyRecipients().length,
      telegram: isTelegramConfigured(),
      ai: aiConfigured,
    },
    leadsTotal: Number(leadsRow?.total ?? 0),
    leadsNew: Number(leadsRow?.fresh ?? 0),
    aiTotal: Number(row?.total ?? 0),
    aiSuccess: Number(row?.success ?? 0),
    aiFallback: Number(row?.fallback ?? 0),
    aiErrors: Number(row?.errors ?? 0),
    avgResponseMs: Math.round(Number(row?.avgResponseMs ?? 0)),
    totalCostUsd: Number(row?.totalCost ?? 0),
    errorsLast24h: Number(last24h?.count ?? 0),
    pendingKnowledgeDrafts: Number(draftsRow?.count ?? 0),
  });
}
