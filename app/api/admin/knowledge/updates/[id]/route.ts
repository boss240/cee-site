import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  await db.delete(schema.documentUpdates).where(eq(schema.documentUpdates.id, id));
  return NextResponse.json({ ok: true });
}
