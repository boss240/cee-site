import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
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
export const maxDuration = 60;

const LeadSchema = z.object({
  name: z.string().trim().min(2).max(255),
  email: z.string().trim().email().max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(64).refine((v) => !v || (/^[+\d\s().-]+$/.test(v) && v.replace(/\D/g, "").length >= 7), "Invalid phone").optional().or(z.literal("")),
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
}).superRefine((data, ctx) => {
  if (data.source === "form" && data.message.length < 10 && !data.website) {
    ctx.addIssue({ code: "custom", path: ["message"], message: "Message must contain at least 10 characters" });
  }
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

    const attemptId = randomUUID();
    try {
      after(async () => {
        try {
          await notifyNewLead({
            ...created,
            source: created.source as "form" | "chat",
            transcript: (created.transcript as { role: "user" | "assistant"; text: string }[] | null) ?? null,
          }, attemptId);
        } catch {
          console.error(JSON.stringify({ event: "lead_notification_failed", leadId: created.id, attemptId }));
        }
      });
      console.info(JSON.stringify({ event: "lead_notification_scheduled", leadId: created.id, attemptId }));
    } catch {
      // The lead is already stored: don't invite a duplicate retry with a false storage error.
      console.error(JSON.stringify({ event: "lead_notification_schedule_failed", leadId: created.id, attemptId }));
    }

    return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
  } catch {
    console.error(JSON.stringify({ event: "lead_storage_failed" }));
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
