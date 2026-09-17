import { NextRequest, NextResponse } from "next/server";
import { eq, ne, and } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const modelId = Number(id);
  const body = await req.json();

  // isDefault=true має "монопольно" вимкнути прапорець в усіх інших моделях —
  // саме цей механізм гарантує, що резервна модель однозначно визначена.
  if (body.isDefault === true) {
    await db
      .update(schema.aiModels)
      .set({ isDefault: false })
      .where(and(ne(schema.aiModels.id, modelId), eq(schema.aiModels.isDefault, true)));
  }

  const updatable: Record<string, unknown> = {};
  for (const key of [
    "name",
    "provider",
    "model",
    "apiKeyEnvVar",
    "priority",
    "isActive",
    "isDefault",
    "inputCostPer1kTokens",
    "outputCostPer1kTokens",
    "systemPrompt",
  ]) {
    if (key in body) updatable[key] = body[key];
  }
  updatable.updatedAt = new Date();

  const [updated] = await db
    .update(schema.aiModels)
    .set(updatable)
    .where(eq(schema.aiModels.id, modelId))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ model: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  await db.delete(schema.aiModels).where(eq(schema.aiModels.id, Number(id)));
  return NextResponse.json({ ok: true });
}
