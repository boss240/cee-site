import { NextRequest, NextResponse, after } from "next/server";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { LeadSubmissionError, storeLeadOnce } from "@/lib/leadIdempotency";
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

  const key = req.headers.get("idempotency-key") ?? "";
  if (!key) {
    // Old bundles only inspect res.ok: never redirect or report success without a stored lead.
    return NextResponse.json({
      error: "client_upgrade_required",
      recovery: "Keep the entered fields in this tab. Copy them to the updated contact form in a new tab before closing this one.",
      recoveryPath: `/${data.locale === "en" ? "en" : "uk"}/contacts`,
    }, { status: 400 });
  }
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(key)) {
    return NextResponse.json({ error: "Valid Idempotency-Key required" }, { status: 400 });
  }

  try {
    const result = await storeLeadOnce(key, {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      segment: data.segment || null,
      message: data.message,
      source: data.source,
      page: data.page || null,
      locale: data.locale || null,
      transcript: data.transcript ?? null,
    }, () => !tooManyRequests(`leads:${clientIp(req)}`, 5, 10 * 60 * 1000));
    if (result.replayed || !result.created) {
      // No notification is scheduled for a replay, including a receipt whose lead was deleted.
      return NextResponse.json({ ok: true, id: result.id }, { status: 201 });
    }
    const created = result.created;

    if (result.notificationsQueued) {
      // Durable rows were committed with the lead. Never also invoke the legacy sender.
      return NextResponse.json({ ok: true, id: created.id }, { status: 201 });
    }
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
  } catch (error) {
    if (error instanceof LeadSubmissionError) {
      return NextResponse.json({ error: error.code }, { status: error.code === "idempotency_conflict" ? 409 : 429 });
    }
    // Includes an unknown COMMIT outcome: do not retry storage or notifications in this request.
    console.error(JSON.stringify({ event: "lead_storage_failed" }));
    return NextResponse.json({ error: "Storage unavailable" }, { status: 503 });
  }
}
