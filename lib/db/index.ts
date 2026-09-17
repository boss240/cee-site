import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

// Next.js завантажує .env.local автоматично для самого застосунку, але
// окремі CLI-скрипти (seed тощо), запущені через tsx, — ні. dotenv не
// перезаписує вже встановлені змінні середовища, тож цей виклик безпечний
// і в контексті Next.js (де DATABASE_URL уже є в process.env).
if (!process.env.DATABASE_URL) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require("dotenv").config({ path: ".env.local" });
}

declare global {
  // eslint-disable-next-line no-var
  var __ceePgPool: Pool | undefined;
}

const pool =
  global.__ceePgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    // Хмарний PostgreSQL (Neon, Supabase, Render…) вимагає TLS. Локальний — ні.
    ssl:
      process.env.DATABASE_SSL === "true" || /neon\.tech|supabase\.co|render\.com|sslmode=require/.test(process.env.DATABASE_URL ?? "")
        ? { rejectUnauthorized: false }
        : undefined,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
  });

if (process.env.NODE_ENV !== "production") {
  global.__ceePgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
