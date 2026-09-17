import { NextRequest, NextResponse } from "next/server";
import { asc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { SourceSchema } from "@/lib/knowledge/adminSchemas";
import { fetchAllEnabled } from "@/lib/knowledge/rss";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const list = await db
    .select({
      id: schema.sources.id, name: schema.sources.name, url: schema.sources.url, category: schema.sources.category,
      enabled: schema.sources.enabled, lastFetchedAt: schema.sources.lastFetchedAt, lastStatus: schema.sources.lastStatus,
      itemsCount: sql<number>`(select count(*)::int from news_items n where n.source_id = ${schema.sources.id})`,
    })
    .from(schema.sources)
    .orderBy(asc(schema.sources.id));
  return NextResponse.json({ sources: list });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const body = await req.json().catch(() => null);
  // Спеціальна дія: оновити всі увімкнені
  if (body?.action === "fetchAll") {
    const results = await fetchAllEnabled();
    return NextResponse.json({ results });
  }
  const parsed = SourceSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  try {
    const [created] = await db.insert(schema.sources).values(parsed.data).returning();
    return NextResponse.json({ source: created }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg.includes("unique") ? "Таке джерело вже є" : "Insert failed" }, { status: 409 });
  }
}
