import { NextRequest, NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const models = await db.select().from(schema.aiModels).orderBy(asc(schema.aiModels.priority));
  return NextResponse.json({ models });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const body = await req.json();
  const { name, provider, model, apiKeyEnvVar, priority, inputCostPer1kTokens, outputCostPer1kTokens, systemPrompt } =
    body;

  if (!name || !provider || !model || !apiKeyEnvVar) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const isFirst = (await db.select().from(schema.aiModels)).length === 0;

  const [created] = await db
    .insert(schema.aiModels)
    .values({
      name,
      provider,
      model,
      apiKeyEnvVar,
      priority: Number(priority) || 0,
      inputCostPer1kTokens: Number(inputCostPer1kTokens) || 0,
      outputCostPer1kTokens: Number(outputCostPer1kTokens) || 0,
      systemPrompt: systemPrompt || null,
      isDefault: isFirst,
    })
    .returning();

  if (isFirst) {
    await db.update(schema.aiModels).set({ isDefault: true }).where(eq(schema.aiModels.id, created.id));
  }

  return NextResponse.json({ model: created }, { status: 201 });
}
