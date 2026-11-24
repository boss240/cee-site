import { NextRequest, NextResponse } from "next/server";
import { asc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { modelRoutingState, validateModelInput } from "@/lib/assistant/modelPolicy";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const models = await db.select().from(schema.aiModels).orderBy(asc(schema.aiModels.priority), asc(schema.aiModels.id));
  const states = new Map(modelRoutingState(models, Boolean(process.env.OPENROUTER_API_KEY_CEE)).map(s => [s.id,s]));
  return NextResponse.json({ models: models.map(m => ({ ...m, ...states.get(m.id) })) });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const parsed = validateModelInput(await req.json().catch(() => null), true);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status:400 });
  const value=parsed.value;
  const [created]=await db.insert(schema.aiModels).values({
    name:value.name!, provider:value.provider!, model:value.model!, apiKeyEnvVar:value.apiKeyEnvVar!,
    priority:value.priority ?? 0, isActive:value.isActive ?? true,
    inputCostPer1kTokens:value.inputCostPer1kTokens ?? 0, outputCostPer1kTokens:value.outputCostPer1kTokens ?? 0,
    systemPrompt:value.systemPrompt ?? null,
  }).returning();
  return NextResponse.json({ model:created }, { status:201 });
}
