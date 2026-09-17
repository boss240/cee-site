import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { SourceSchema } from "@/lib/knowledge/adminSchemas";
import { fetchSource } from "@/lib/knowledge/rss";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  const parsed = SourceSchema.partial().safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const [updated] = await db.update(schema.sources).set(parsed.data).where(eq(schema.sources.id, id)).returning();
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ source: updated });
}

/** POST { action: "check" | "fetch" } — перевірити стрічку (без запису) або забрати новини */
export async function POST(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  const body = await req.json().catch(() => ({}));
  const [source] = await db.select().from(schema.sources).where(eq(schema.sources.id, id));
  if (!source) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const result = await fetchSource(source, { dryRun: body?.action === "check" });
  return NextResponse.json({ result });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  await db.delete(schema.sources).where(eq(schema.sources.id, id));
  return NextResponse.json({ ok: true });
}
