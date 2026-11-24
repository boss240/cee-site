import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const BACKUP_BUDGET_MICRO_USD = 2_000_000;
export type BackupQuote = Readonly<{
  provider: "openai" | "anthropic";
  model: string;
  pricingVersion: string;
  maxCostMicroUSD: number;
}>;
/** Server-only capability; never serialize to clients, logs or provider requests. */
export type BackupReservation = Readonly<{ id: string; fence: string; ceiling: number }>;
const identifier = /^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,159}$/;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
function money(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0 && value <= BACKUP_BUDGET_MICRO_USD;
}
function quoteValid(q: BackupQuote): boolean {
  return !!q && (q.provider === "openai" || q.provider === "anthropic") &&
    typeof q.model === "string" && identifier.test(q.model) &&
    typeof q.pricingVersion === "string" && identifier.test(q.pricingVersion) &&
    money(q.maxCostMicroUSD) && q.maxCostMicroUSD > 0;
}

/** Trusted, allowlisted server pricing only. This is the sole global reservation for
 * this attempt: DO NOT call reserveAICall as well. No retry on uncertain COMMIT.
 * Unknown money is held forever; resolved spend ages from DB settlement time.
 * App admission ceiling, not an account-wide invoice/tax/other-app spending cap.
 */
export async function reserveBackupCall(quote: BackupQuote): Promise<BackupReservation | null> {
  if (!quoteValid(quote)) return null;
  const approved = Object.freeze({ ...quote });
  const receipt = Object.freeze({ id: randomUUID(), fence: randomUUID(), ceiling: approved.maxCostMicroUSD });
  try {
    return await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL lock_timeout = '2s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '3s'`);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1128613185, 1)`);
      const counts = await tx.execute(sql`SELECT
        (SELECT count(*)::int FROM ai_call_reservations WHERE created_at >= clock_timestamp() - interval '24 hours') AS recent,
        (SELECT count(*)::int FROM ai_call_reservations WHERE settled_at IS NULL) AS active,
        (SELECT COALESCE(sum(CASE WHEN settled_at IS NULL THEN max_cost_microusd ELSE actual_cost_microusd END), 0)::text
          FROM backup_cost_reservations WHERE settled_at IS NULL OR settled_at >= clock_timestamp() - interval '24 hours') AS held`);
      const row = counts.rows[0];
      if (!row || typeof row.recent !== "number" || !Number.isInteger(row.recent) || row.recent < 0 || row.recent >= 20 ||
          typeof row.active !== "number" || !Number.isInteger(row.active) || row.active < 0 || row.active >= 2 ||
          typeof row.held !== "string" || !/^(0|[1-9][0-9]*)$/.test(row.held)) return null;
      const held = Number(row.held);
      if (!money(held) || approved.maxCostMicroUSD > BACKUP_BUDGET_MICRO_USD - held) return null;
      await tx.execute(sql`INSERT INTO ai_call_reservations (id, created_at) VALUES (${receipt.id}, clock_timestamp())`);
      await tx.execute(sql`INSERT INTO backup_cost_reservations
        (reservation_id, fence, provider, model, pricing_version, max_cost_microusd, created_at)
        VALUES (${receipt.id}, ${receipt.fence}, ${approved.provider}, ${approved.model}, ${approved.pricingVersion}, ${approved.maxCostMicroUSD}, clock_timestamp())`);
      return receipt;
    }, { isolationLevel: "read committed" });
  } catch {
    return null;
  }
}

/** Only call with verified final usage from a resolved response. No error/timeout/
 * abort refund path exists. Malformed, overquote or inconsistent duplicate usage
 * stays held. Global attempt charge remains; only active slot is released.
 */
export async function settleResolvedBackupCall(
  receipt: BackupReservation,
  usage: Readonly<{ kind: "verified_final_usage"; actualCostMicroUSD: number }>,
): Promise<boolean> {
  if (!receipt || !uuid.test(receipt.id) || !uuid.test(receipt.fence) || !money(receipt.ceiling) ||
      !usage || usage.kind !== "verified_final_usage" || !money(usage.actualCostMicroUSD) ||
      usage.actualCostMicroUSD > receipt.ceiling) return false;
  const token = Object.freeze({ ...receipt });
  const actual = usage.actualCostMicroUSD;
  try {
    return await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL lock_timeout = '2s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '3s'`);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1128613185, 1)`);
      const result = await tx.execute(sql`SELECT max_cost_microusd AS ceiling, actual_cost_microusd AS actual, settled_at
        FROM backup_cost_reservations WHERE reservation_id = ${token.id} AND fence = ${token.fence} FOR UPDATE`);
      const row = result.rows[0];
      if (!row || row.ceiling !== token.ceiling) return false;
      if (row.settled_at !== null) return row.actual === actual;
      if (row.actual !== null) return false;
      await tx.execute(sql`UPDATE backup_cost_reservations SET actual_cost_microusd = ${actual}, settled_at = clock_timestamp()
        WHERE reservation_id = ${token.id} AND fence = ${token.fence} AND settled_at IS NULL`);
      await tx.execute(sql`UPDATE ai_call_reservations SET settled_at = clock_timestamp() WHERE id = ${token.id} AND settled_at IS NULL`);
      return true;
    }, { isolationLevel: "read committed" });
  } catch {
    return false;
  }
}
