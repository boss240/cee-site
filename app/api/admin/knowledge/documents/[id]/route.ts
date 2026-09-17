import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { DocumentSchema, toDate } from "@/lib/knowledge/adminSchemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  const parsed = DocumentSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const { checked, adoptedAt, ...d } = parsed.data;
  const patch: Partial<typeof schema.documents.$inferInsert> = { ...d, updatedAt: new Date() };
  if ("number" in d) patch.number = d.number || null;
  if ("issuer" in d) patch.issuer = d.issuer || null;
  if ("sourceUrl" in d) patch.sourceUrl = d.sourceUrl || null;
  if (adoptedAt !== undefined) patch.adoptedAt = toDate(adoptedAt);
  if (checked) patch.checkedAt = new Date();
  try {
    const [updated] = await db.update(schema.documents).set(patch).where(eq(schema.documents.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ document: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg.includes("unique") ? "Такий slug уже існує" : "Update failed" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  await db.delete(schema.documents).where(eq(schema.documents.id, id));
  return NextResponse.json({ ok: true });
}
