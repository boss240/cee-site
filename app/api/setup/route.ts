import { NextRequest, NextResponse } from "next/server";
import { runMigrations } from "@/lib/db/migrations";
import { seedDatabase } from "@/lib/db/seedData";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/setup — одноразова ініціалізація БД на хостингу: створює таблиці і наповнює
 * стартовими даними (адмін, AI-моделі, профіль, послуги, статті, документи).
 * Захист: заголовок x-setup-token має збігатися з SETUP_TOKEN. Без змінної — маршрут «не існує».
 * Повторний виклик безпечний (міграції і сід ідемпотентні).
 */
export async function POST(req: NextRequest) {
  const expected = process.env.SETUP_TOKEN;
  const provided = req.headers.get("x-setup-token");
  if (!expected || !provided || provided.length !== expected.length || provided !== expected) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    const migrations = await runMigrations();
    const seed = await seedDatabase();
    return NextResponse.json({ ok: true, migrations, seed });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
