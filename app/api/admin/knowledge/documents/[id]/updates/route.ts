import { NextRequest, NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { DocumentUpdateSchema, toDate } from "@/lib/knowledge/adminSchemas";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  const updates = await db.select().from(schema.documentUpdates).where(eq(schema.documentUpdates.documentId, id)).orderBy(desc(schema.documentUpdates.date));
  return NextResponse.json({ updates });
}

/** Додати запис у журнал змін документа; також оновлює checkedAt/updatedAt */
export async function POST(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  const parsed = DocumentUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const [created] = await db
    .insert(schema.documentUpdates)
    .values({ documentId: id, date: toDate(parsed.data.date) ?? new Date(), note: parsed.data.note, sourceUrl: parsed.data.sourceUrl || null })
    .returning();
  await db.update(schema.documents).set({ checkedAt: new Date(), updatedAt: new Date() }).where(eq(schema.documents.id, id));
  return NextResponse.json({ update: created }, { status: 201 });
}
