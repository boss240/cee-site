import { NextResponse } from "next/server";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

/** GET /api/admin/leads — список заявок (нові першими) і лічильники за статусами. */
export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const [list, counts] = await Promise.all([
    db.select().from(schema.leads).orderBy(desc(schema.leads.createdAt)).limit(500),
    db
      .select({ status: schema.leads.status, count: sql<number>`count(*)::int` })
      .from(schema.leads)
      .groupBy(schema.leads.status),
  ]);

  const byStatus: Record<string, number> = {};
  for (const row of counts) byStatus[row.status] = row.count;

  return NextResponse.json({ leads: list, byStatus });
}

/** DELETE усіх спам-заявок — прибирання. */
export async function DELETE() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const deleted = await db.delete(schema.leads).where(eq(schema.leads.status, "spam")).returning({ id: schema.leads.id });
  return NextResponse.json({ deleted: deleted.length });
}
