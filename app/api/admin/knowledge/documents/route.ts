import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { DocumentSchema, toDate } from "@/lib/knowledge/adminSchemas";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const list = await db.select().from(schema.documents).orderBy(desc(schema.documents.updatedAt));
  return NextResponse.json({ documents: list });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const parsed = DocumentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const { checked, adoptedAt, ...d } = parsed.data;
  try {
    const [created] = await db
      .insert(schema.documents)
      .values({ ...d, number: d.number || null, issuer: d.issuer || null, sourceUrl: d.sourceUrl || null, adoptedAt: toDate(adoptedAt), checkedAt: checked ? new Date() : null })
      .returning();
    return NextResponse.json({ document: created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg.includes("unique") ? "Такий slug уже існує" : "Insert failed" }, { status: 409 });
  }
}
