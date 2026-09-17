import type { Config } from "drizzle-kit";
import { config as loadEnv } from "dotenv";

// drizzle-kit — окремий CLI, він не читає .env.local сам (на відміну від Next.js).
// dotenv не перезаписує вже встановлені змінні, тож у CI/на хостингу це безпечно.
loadEnv({ path: ".env.local" });
loadEnv();

export default {
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/cee_site",
  },
} satisfies Config;
