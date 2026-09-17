import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

function nextInvoiceNumber(count: number) {
  const year = new Date().getFullYear();
  return `INV-${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const list = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
  return NextResponse.json({ invoices: list });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const body = await req.json();
  const existing = await db.select().from(schema.invoices);
  const number = nextInvoiceNumber(existing.length);

  const [created] = await db
    .insert(schema.invoices)
    .values({
      number,
      clientName: body.clientName ?? "",
      clientDetails: body.clientDetails ?? "",
      amount: Number(body.amount) || 0,
      currency: body.currency ?? "UAH",
      status: body.status ?? "draft",
      serviceDescription: body.serviceDescription ?? "",
      dueAt: body.dueAt ? new Date(body.dueAt) : null,
    })
    .returning();

  return NextResponse.json({ invoice: created }, { status: 201 });
}
