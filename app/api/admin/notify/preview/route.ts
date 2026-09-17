import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth/requireAdmin";
import { centerNotification, clientAutoReply } from "@/lib/notify/templates";

/**
 * GET /api/admin/notify/preview?type=client|center&locale=uk|en
 * Показує лист у браузері на прикладі — щоб бачити вигляд до підключення пошти.
 */
export async function GET(req: NextRequest) {
  const guard = await requireAdminSession();
  if (guard.response) return guard.response;

  const type = req.nextUrl.searchParams.get("type") === "center" ? "center" : "client";
  const locale = req.nextUrl.searchParams.get("locale") === "en" ? "en" : "uk";
  const siteUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");

  const sample = {
    id: 42,
    name: locale === "en" ? "Olena" : "Олена",
    email: "olena@example.com",
    phone: "+380 67 000 00 00",
    segment: "osbb",
    message:
      locale === "en"
        ? "60-flat building, 2012. We want solar and storage, the board meeting is in October. Metering is old, no hourly profile."
        : "Будинок на 60 квартир, 2012 року. Хочемо СЕС і накопичувач, збори співвласників у жовтні. Облік старий, погодинного профілю немає.",
    source: "form" as const,
    page: "/contacts",
    locale,
    transcript: null,
    createdAt: new Date(),
  };

  const mail = type === "center" ? centerNotification(sample, siteUrl) : clientAutoReply(sample, siteUrl);
  return new NextResponse(mail.html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
