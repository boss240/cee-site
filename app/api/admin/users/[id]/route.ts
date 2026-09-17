import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { UserPlanSchema, toDate } from "@/lib/knowledge/adminSchemas";

type Ctx = { params: Promise<{ id: string }> };

/** PUT { plan, planUntil } — ручне призначення тарифу (до підключення платіжного шлюзу) */
export async function PUT(req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  const parsed = UserPlanSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  const [updated] = await db
    .update(schema.users)
    .set({ plan: parsed.data.plan, planUntil: parsed.data.plan === "free" ? null : toDate(parsed.data.planUntil) })
    .where(eq(schema.users.id, id))
    .returning({ id: schema.users.id, plan: schema.users.plan, planUntil: schema.users.planUntil });
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ user: updated });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const id = Number((await params).id);
  await db.delete(schema.users).where(eq(schema.users.id, id));
  return NextResponse.json({ ok: true });
}
