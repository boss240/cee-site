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
  for (const key of ["clientName", "clientDetails", "amount", "currency", "status", "serviceDescription"]) {
    if (key in body) updatable[key] = body[key];
  }
  if (body.status === "paid") updatable.paidAt = new Date();

  const [updated] = await db
    .update(schema.invoices)
    .set(updatable)
    .where(eq(schema.invoices.id, Number(id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  await db.delete(schema.invoices).where(eq(schema.invoices.id, Number(id)));
  return NextResponse.json({ ok: true });
}
