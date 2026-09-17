import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { DigestSchema, toDate } from "@/lib/knowledge/adminSchemas";
import { assignNewsToDigest } from "@/lib/knowledge/digests";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const list = await db.select().from(schema.digests).orderBy(desc(schema.digests.updatedAt));
  return NextResponse.json({ digests: list });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const parsed = DigestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const { newsIds, periodFrom, periodTo, ...d } = parsed.data;
  try {
    const [created] = await db
      .insert(schema.digests)
      .values({ ...d, periodFrom: toDate(periodFrom), periodTo: toDate(periodTo), publishedAt: d.published ? new Date() : null })
      .returning();
    if (newsIds?.length) await assignNewsToDigest(created.id, newsIds);
    return NextResponse.json({ digest: created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg.includes("unique") ? "Такий slug уже існує" : "Insert failed" }, { status: 409 });
  }
}
