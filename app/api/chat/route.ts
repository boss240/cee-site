import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { answerFromKnowledgeBase } from "@/lib/knowledgeBase";
import { resilientReply } from "@/lib/assistant/resilientReply";
import type { ChatResult } from "@/lib/ai-factory";
import { clientIp, tooManyRequests } from "@/lib/rateLimit";

/**
 * POST /api/chat
 * body: { message: string; locale?: "uk" | "en"; page?: string; history?: {role, text}[] }
 *
 * At most one paid OpenRouter attempt. Any failure uses explicitly labeled static
 * local reference. The AI/DB module is imported inside the guarded boundary.
 */
const BodySchema = z.object({
  message: z.string().trim().min(1).max(2000),
  locale: z.enum(["uk", "en"]).default("uk"),
  page: z.string().max(255).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), text: z.string().max(4000) }))
    .max(30)
    .default([]),
});

export async function POST(req: NextRequest) {
  // Помічник публічний, а виклики LLM платні — обмежуємо частоту з однієї адреси.
  if (tooManyRequests(`chat:${clientIp(req)}`, 40, 10 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  const parsed = BodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  const { message, locale, page, history } = parsed.data;

  const { reply, source, modelName, fallbackReason } = await resilientReply<ChatResult>(
    async () => {
      const { getAssistantReply } = await import("@/lib/ai-factory");
      return getAssistantReply(message, locale, page, history);
    },
    () => ({ reply: answerFromKnowledgeBase(message, locale).answer,
      source: "knowledge-base", fallbackReason: "runtime_unavailable" }),
  );

  return NextResponse.json({ reply, source, modelName, fallbackReason });
}
