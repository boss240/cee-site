import { sql } from "drizzle-orm";
import { db } from "./index";
import { MIGRATIONS } from "./migrationCatalog";

/** Застосовує ще не застосовані міграції. Повертає список застосованих id. */
export async function runMigrations(): Promise<string[]> {
  await db.execute(sql`CREATE TABLE IF NOT EXISTS "__cee_migrations" ("id" text PRIMARY KEY, "applied_at" timestamp DEFAULT now() NOT NULL)`);
  const done = await db.execute(sql`SELECT "id" FROM "__cee_migrations"`);
  const doneIds = new Set((done.rows as { id: string }[]).map((r) => r.id));
  const applied: string[] = [];
  for (const m of MIGRATIONS) {
    if (doneIds.has(m.id)) continue;
    const statements = m.sql
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    await db.transaction(async (tx) => {
      for (const st of statements) await tx.execute(sql.raw(st));
      await tx.execute(sql`INSERT INTO "__cee_migrations" ("id") VALUES (${m.id})`);
    });
    applied.push(m.id);
  }
  return applied;
}
