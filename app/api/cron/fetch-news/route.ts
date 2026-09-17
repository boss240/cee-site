import { NextRequest, NextResponse } from "next/server";
import { fetchAllEnabled } from "@/lib/knowledge/rss";

/**
 * GET/POST /api/cron/fetch-news — оновити всі увімкнені RSS-джерела.
 * Захист: заголовок Authorization: Bearer <CRON_SECRET> або ?secret=.
 * Vercel Cron надсилає Authorization автоматично, якщо задано CRON_SECRET.
 * На VPS — crontab: curl -H "Authorization: Bearer $CRON_SECRET" https://site/api/cron/fetch-news
 */
async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET не задано" }, { status: 503 });
  const auth = req.headers.get("authorization") ?? "";
  const q = req.nextUrl.searchParams.get("secret") ?? "";
  if (auth !== `Bearer ${secret}` && q !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const results = await fetchAllEnabled();
  return NextResponse.json({ ok: true, at: new Date().toISOString(), results });
}
export const GET = handle;
export const POST = handle;
export const dynamic = "force-dynamic";
