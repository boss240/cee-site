import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { clientIp, tooManyRequests } from "@/lib/rateLimit";

const Schema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(200),
  name: z.string().trim().max(255).optional(),
  organization: z.string().trim().max(255).optional(),
  locale: z.enum(["uk", "en"]).optional(),
  website: z.string().optional(), // honeypot
});

/** POST /api/auth/register — реєстрація публічного користувача (план free) */
export async function POST(req: NextRequest) {
  if (tooManyRequests(`register:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "too-many" }, { status: 429 });
  }
  const parsed = Schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid" }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // бот

  const passwordHash = await bcrypt.hash(d.password, 10);
  try {
    const [created] = await db
      .insert(schema.users)
      .values({ email: d.email, passwordHash, name: d.name || null, organization: d.organization || null, locale: d.locale ?? null })
      .returning({ id: schema.users.id });
    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg.includes("unique")) return NextResponse.json({ error: "exists" }, { status: 409 });
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
}
