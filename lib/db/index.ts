import { drizzle } from "drizzle-orm/node-postgres";
import type { Pool } from "pg";
import { createDatabasePool } from "./pool";
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
  var __ceePgPool: Pool | undefined;
}

const pool =
  global.__ceePgPool ??
  createDatabasePool(process.env.DATABASE_URL);

if (process.env.NODE_ENV !== "production") {
  global.__ceePgPool = pool;
}

export const db = drizzle(pool, { schema });
export { schema };
