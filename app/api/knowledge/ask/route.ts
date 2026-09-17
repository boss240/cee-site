import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { quotaFor, recordAsk, resolveActor } from "@/lib/knowledge/metering";
import { answerQuestion } from "@/lib/knowledge/ask";
import { clientIp, tooManyRequests } from "@/lib/rateLimit";

const Body = z.object({
  question: z.string().trim().min(5).max(1500),
  locale: z.enum(["uk", "en"]).default("uk"),
});

/**
 * POST /api/knowledge/ask — консультація по законодавству з лімітом на добу.
 * 429 quota  → ліміт плану вичерпано (UI показує реєстрацію/тарифи)
 * 429 burst  → надто часто (захист від скриптів)
 */
export async function POST(req: NextRequest) {
  if (tooManyRequests(`ask:${clientIp(req)}`, 30, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "burst" }, { status: 429 });
  }
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "validation" }, { status: 400 });

  const actor = await resolveActor(req);
  const quota = await quotaFor(actor);
  if (quota.remaining !== null && quota.remaining <= 0) {
    return NextResponse.json({ error: "quota", quota, signedIn: actor.kind === "user" }, { status: 429 });
  }

  const result = await answerQuestion(parsed.data.question, parsed.data.locale);
  await recordAsk(actor, parsed.data.question);
  const after = await quotaFor(actor);
  return NextResponse.json({ ...result, quota: after, signedIn: actor.kind === "user" });
}
