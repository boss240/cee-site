import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, schema } from "@/lib/db";
import { notifyNewLead } from "@/lib/notify";
import { clientIp, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/leads — публічний прийом заявок.
 * Джерела: форма на сторінці «Контакти» (source=form) і чат AI-помічника (source=chat).
 *
 * Захист без зовнішніх сервісів:
 *  - honeypot-поле `website` — боти його заповнюють, люди не бачать;
 *  - м'який ліміт: не більше 5 заявок з однієї адреси за 10 хвилин (в пам'яті процесу).
 */
const LeadSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(64).optional().or(z.literal("")),
  segment: z.string().trim().max(32).optional(),
  message: z.string().trim().max(5000).default(""),
  source: z.enum(["form", "chat"]).default("form"),
  page: z.string().trim().max(255).optional(),
  locale: z.enum(["uk", "en"]).optional(),
  transcript: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) }))
    .max(60)
    .optional(),
  website: z.string().optional(), // honeypot
});

export async function POST(req: NextRequest) {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = LeadSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  // Бот заповнив приховане поле — відповідаємо «ок», але нічого не зберігаємо.
  if (data.website) {
    return NextResponse.json({ ok: true });
  }

  // Потрібен хоча б один канал зв'язку.
  if (!data.email && !data.phone) {
    return NextResponse.json({ error: "Contact required" }, { status: 400 });
  }

  if (tooManyRequests(`leads:${clientIp(req)}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const [created] = await db
      .insert(schema.leads)
      .values({
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        segment: data.segment || null,
        message: data.message,
        source: data.source,
        page: data.page || null,
        locale: data.locale || null,
        transcript: data.transcript ?? null,
      })
      .returning();

    // Сповіщення — у фоні; клієнт не чекає на SMTP/Telegram.
    void notifyNewLead({
      ...created,
      source: created.source as "form" | "chat",
      transcript: (created.transcript as { role: "user" | "assistant"; text: string }[] | null) ?? null,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch (error) {
    console.error("[leads] insert failed", error);
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
