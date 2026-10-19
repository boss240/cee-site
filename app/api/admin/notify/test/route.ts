import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { verifyEmail } from "@/lib/notify/email";
import { isTelegramConfigured, sendTelegram } from "@/lib/notify/telegram";

/** POST /api/admin/notify/test — перевірити SMTP і надіслати тестове повідомлення в Telegram */
export async function POST() {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const email = await verifyEmail();
  let telegram: { ok: boolean; message: string } = { ok: false, message: "Telegram не налаштовано в .env.local" };
  if (isTelegramConfigured()) {
    try {
      const r = await sendTelegram("✅ Тестове повідомлення з сайту ЦЕЕ — сповіщення про заявки працюють.");
      telegram = r.skipped ? telegram : { ok: r.total > 0 && r.sent === r.total, message: r.total > 0 && r.sent === r.total ? "OK" : "Telegram відхилив повідомлення" };
    } catch {
      telegram = { ok: false, message: "Telegram transport failed" };
    }
  }
  return NextResponse.json({ email, telegram });
}
