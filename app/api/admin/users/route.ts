import { NextResponse } from "next/server";
import { desc, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

export async function GET() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const users = await db
    .select({
      id: schema.users.id, email: schema.users.email, name: schema.users.name, organization: schema.users.organization,
      plan: schema.users.plan, planUntil: schema.users.planUntil, locale: schema.users.locale,
      createdAt: schema.users.createdAt, lastLoginAt: schema.users.lastLoginAt,
      asksTotal: sql<number>`(select count(*)::int from usage_events e where e.user_id = ${schema.users.id})`,
      asks30d: sql<number>`(select count(*)::int from usage_events e where e.user_id = ${schema.users.id} and e.created_at > now() - interval '30 days')`,
    })
    .from(schema.users)
    .orderBy(desc(schema.users.createdAt))
    .limit(500);
  return NextResponse.json({ users });
}
