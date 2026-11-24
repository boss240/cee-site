import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

/** Technical allowance, NOT a monetary budget or subscription entitlement.
 * All replicas must use this database and gate. Owner approval required before activation.
 */
export const AI_BUDGET = Object.freeze({
  callsPer24Hours: 20,
  concurrentCalls: 2,
  maxInputBytes: 24000,
  maxOutputTokens: 1500,
  maxTimeoutMs: 20000,
});

/** Fail closed, including missing schema and uncertain COMMIT. Never retry reservation.
 * Separate lock/count statements ensure a fresh READ COMMITTED snapshot after waiting.
 */
export async function reserveAICall(): Promise<string | null> {
  const id = randomUUID();
  try {
    return await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL lock_timeout = '2s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '3s'`);
      await tx.execute(sql`SELECT pg_advisory_xact_lock(1128613185, 1)`);
      const counts = await tx.execute(sql`SELECT
        (SELECT count(*)::int FROM ai_call_reservations WHERE created_at >= clock_timestamp() - interval '24 hours') AS recent,
        (SELECT count(*)::int FROM ai_call_reservations WHERE settled_at IS NULL) AS active`);
      const row = counts.rows[0];
      if (!row || typeof row.recent !== "number" || typeof row.active !== "number" ||
          !Number.isInteger(row.recent) || !Number.isInteger(row.active) || row.recent < 0 || row.active < 0 ||
          row.recent >= AI_BUDGET.callsPer24Hours || row.active >= AI_BUDGET.concurrentCalls) return null;
      await tx.execute(sql`INSERT INTO ai_call_reservations (id, created_at) VALUES (${id}, clock_timestamp())`);
      return id;
    }, { isolationLevel: "read committed" });
  } catch {
    return null;
  }
}

/** Only a resolved SDK response may release its slot. Rejected/aborted/unknown work
 * stays blocked for manual reconciliation; no TTL, refund, deletion or background reset.
 * Settlement does not remove the rolling-window charge. Failed settlement stays closed.
 */
export async function settleAICall(id: string): Promise<void> {
  try {
    await db.transaction(async tx => {
      await tx.execute(sql`SET LOCAL lock_timeout = '2s'`);
      await tx.execute(sql`SET LOCAL statement_timeout = '3s'`);
      await tx.execute(sql`UPDATE ai_call_reservations SET settled_at = clock_timestamp() WHERE id = ${id} AND settled_at IS NULL`);
    });
  } catch {
    // Intentionally retain slot if settlement cannot be confirmed.
  }
}
