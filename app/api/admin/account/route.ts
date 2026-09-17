import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth/requireAdmin";

const Schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(10).max(200),
});

/** POST /api/admin/account — зміна пароля поточного адміністратора */
export async function POST(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;
  const email = guard.session.user?.email;
  if (!email) return NextResponse.json({ error: "No session email" }, { status: 400 });

  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "weak" }, { status: 400 });

  const [user] = await db.select().from(schema.adminUsers).where(eq(schema.adminUsers.email, email)).limit(1);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return NextResponse.json({ error: "wrong-current" }, { status: 403 });

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10);
  await db.update(schema.adminUsers).set({ passwordHash }).where(eq(schema.adminUsers.id, user.id));
  return NextResponse.json({ ok: true });
}
