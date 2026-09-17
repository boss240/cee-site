import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const body = await req.json();
  const updatable: Record<string, unknown> = {};
  for (const key of ["titleUk", "titleEn", "descriptionUk", "descriptionEn", "price", "currency", "status"]) {
    if (key in body) updatable[key] = body[key];
  }
  updatable.updatedAt = new Date();

  const [updated] = await db
    .update(schema.services)
    .set(updatable)
    .where(eq(schema.services.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ service: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  await db.delete(schema.services).where(eq(schema.services.id, Number(id)));
  return NextResponse.json({ ok: true });
}
