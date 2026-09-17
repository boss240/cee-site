import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { DigestSchema, toDate } from "@/lib/knowledge/adminSchemas";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  const parsed = DigestSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const { newsIds: _n, periodFrom, periodTo, ...d } = parsed.data;
  void _n;
  const [current] = await db.select().from(schema.digests).where(eq(schema.digests.id, id));
  if (!current) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const patch: Partial<typeof schema.digests.$inferInsert> = { ...d, updatedAt: new Date() };
  if (periodFrom !== undefined) patch.periodFrom = toDate(periodFrom);
  if (periodTo !== undefined) patch.periodTo = toDate(periodTo);
  if (d.published && !current.publishedAt) patch.publishedAt = new Date();
  try {
    const [updated] = await db.update(schema.digests).set(patch).where(eq(schema.digests.id, id)).returning();
    return NextResponse.json({ digest: updated });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg.includes("unique") ? "Такий slug уже існує" : "Update failed" }, { status: 409 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  await db.update(schema.newsItems).set({ digestId: null }).where(eq(schema.newsItems.digestId, id));
  await db.delete(schema.digests).where(eq(schema.digests.id, id));
  return NextResponse.json({ ok: true });
}
