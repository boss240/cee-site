import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

import { invoiceId, invoicePatch } from "@/lib/invoiceInput";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const id = invoiceId.safeParse((await params).id);
  const parsed = invoicePatch.safeParse(await req.json().catch(() => null));
  if (!id.success || !parsed.success) return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
  const body = parsed.data;
  const updatable = { ...body, ...(body.status === "paid" ? { paidAt: new Date() } : {}) };

  const [updated] = await db
    .update(schema.invoices)
    .set(updatable)
    .where(eq(schema.invoices.id, id.data))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ invoice: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const id = invoiceId.safeParse((await params).id);
  if (!id.success) return NextResponse.json({ error: "Invalid invoice id" }, { status: 400 });
  await db.delete(schema.invoices).where(eq(schema.invoices.id, id.data));
  return NextResponse.json({ ok: true });
}
