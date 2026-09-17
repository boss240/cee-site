import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { InvoiceDocument } from "@/lib/pdf/InvoiceDocument";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const { id } = await params;
  const [invoice] = await db.select().from(schema.invoices).where(eq(schema.invoices.id, Number(id)));
  if (!invoice) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let [company] = await db.select().from(schema.companyProfile).limit(1);
  if (!company) {
    [company] = await db.insert(schema.companyProfile).values({}).returning();
  }

  const buffer = await renderToBuffer(<InvoiceDocument invoice={invoice} company={company} />);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoice.number}.pdf"`,
    },
  });
}
