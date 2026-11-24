import { validateModelInput } from "@/lib/assistant/modelPolicy";
import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const modelId = Number(id);
  if (!Number.isSafeInteger(modelId) || modelId < 1) return NextResponse.json({ error: "Invalid model ID" }, { status:400 });
  const parsed=validateModelInput(await req.json().catch(() => null), false);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status:400 });
  const updatable={ ...parsed.value, updatedAt:new Date() };

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
