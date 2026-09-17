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
      telegram = r.skipped ? telegram : { ok: r.sent > 0, message: r.sent > 0 ? "OK" : "Telegram відхилив повідомлення" };
    } catch (err) {
      telegram = { ok: false, message: err instanceof Error ? err.message : String(err) };
    }
  }
  return NextResponse.json({ email, telegram });
}
