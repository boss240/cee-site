import { NextRequest, NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

import { invoiceCreate } from "@/lib/invoiceInput";

import { createNumberedInvoice } from "@/lib/invoiceNumbering";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const list = await db.select().from(schema.invoices).orderBy(desc(schema.invoices.createdAt));
  return NextResponse.json({ invoices: list });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const parsed = invoiceCreate.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid invoice" }, { status: 400 });
  try {
    const created = await createNumberedInvoice(parsed.data);
    return NextResponse.json({ invoice: created }, { status: 201 });
  } catch {
    // Do not expose SQL, customer data, or imply a retry is safe after a lost response.
    return NextResponse.json({ error: "Invoice storage unavailable; check the invoice list before retrying" }, { status: 503 });
  }
}
