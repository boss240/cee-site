import { NextRequest, NextResponse } from "next/server";
import { requireSeedAdminPassword } from "@/lib/db/seedCredentials";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/setup — одноразова ініціалізація БД на хостингу: створює таблиці і наповнює
 * стартовими даними (адмін, AI-моделі, профіль, послуги, статті, документи).
 * Захист: заголовок x-setup-token має збігатися з SETUP_TOKEN. Без змінної — маршрут «не існує».
 * Production завжди повертає 404. Міграції production — лише окремим перевіреним CLI-планом.
 */
export async function POST(req: NextRequest) {
  // Never initialize a production database through a public HTTP endpoint.
  // Check before reading credentials or importing database modules.
  const isolatedVercel = process.env.VERCEL === "1" &&
    (process.env.VERCEL_ENV === "preview" || process.env.VERCEL_ENV === "development");
  const localDevelopment = !process.env.VERCEL && !process.env.VERCEL_ENV &&
    (process.env.NODE_ENV === "development" || process.env.NODE_ENV === "test");
  if (!isolatedVercel && !localDevelopment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const expected = process.env.SETUP_TOKEN;
  const provided = req.headers.get("x-setup-token");
  if (!expected || !provided || provided.length !== expected.length || provided !== expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    requireSeedAdminPassword();
    const { runMigrations } = await import("@/lib/db/migrations");
    const { seedDatabase } = await import("@/lib/db/seedData");
    const migrations = await runMigrations();
    const seed = await seedDatabase();
    return NextResponse.json({ ok: true, migrations, seed });
  } catch {
    return NextResponse.json({ ok: false, error: "setup_failed_check_configuration" }, { status: 500 });
  }
}
