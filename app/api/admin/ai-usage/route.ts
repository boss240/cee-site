import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const logs = await db
    .select()
    .from(schema.aiUsageLogs)
    .orderBy(desc(schema.aiUsageLogs.createdAt))
    .limit(50);

  return NextResponse.json({ logs });
}
