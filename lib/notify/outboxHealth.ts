import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export type QueueCount = { status: string; channel: string; count: number };
export type QueueEntry = {
  id: string; eventId: string; leadId: number | null; channel: string; status: string;
  attempts: number; errorCode: string | null; availableAt: string; leaseUntil: string | null;
  createdAt: string; updatedAt: string;
};
export type OutboxHealth = {
  state: "ready" | "not_configured" | "unavailable";
  captureEnabled: boolean; dispatchEnabled: boolean; scheduledTriggerEnabled: boolean;
  observedAt: string | null; counts: QueueCount[]; due: number | null;
  expiredLeases: number | null; oldestDueAt: string | null; entries: QueueEntry[];
};

/** Only operational metadata. Never select recipients, lead content, transcripts or secrets. */
export async function readOutboxHealth(): Promise<OutboxHealth> {
  const base: OutboxHealth = {
    state: "unavailable", captureEnabled: process.env.CEE_NOTIFICATION_OUTBOX_CAPTURE === "true",
    dispatchEnabled: process.env.CEE_NOTIFICATION_OUTBOX_DISPATCH === "true",
    scheduledTriggerEnabled: process.env.CEE_NOTIFICATION_OUTBOX_SCHEDULED_TRIGGER === "true",
    observedAt: null, counts: [], due: null, expiredLeases: null, oldestDueAt: null, entries: [],
  };
  try {
    return await db.transaction(async tx => {
      await tx.execute(sql`SET TRANSACTION READ ONLY`);
      await tx.execute(sql`SET LOCAL statement_timeout = '3s'`);
      await tx.execute(sql`SET LOCAL lock_timeout = '1s'`);
      const identity = await tx.execute(sql`SELECT clock_timestamp()::text AS observed_at,
        to_regclass('public.lead_notification_deliveries') IS NOT NULL AS configured`);
      const row = identity.rows[0];
      if (!row || typeof row.configured !== "boolean" || typeof row.observed_at !== "string") throw new Error("queue_health_invalid");
      if (!row.configured) return { ...base, state: "not_configured" as const, observedAt: row.observed_at };
      const counts = await tx.execute(sql`SELECT status, channel, count(*)::int AS count
        FROM public.lead_notification_deliveries GROUP BY status, channel ORDER BY status, channel`);
      const summary = await tx.execute(sql`SELECT
        count(*) FILTER (WHERE status IN ('pending','retry') AND available_at <= clock_timestamp() AND attempts < 6)::int AS due,
        count(*) FILTER (WHERE status='leased' AND lease_until <= clock_timestamp())::int AS expired_leases,
        min(available_at) FILTER (WHERE status IN ('pending','retry') AND available_at <= clock_timestamp() AND attempts < 6)::text AS oldest_due_at
        FROM public.lead_notification_deliveries`);
      const entries = await tx.execute(sql`SELECT id::text, event_id::text AS "eventId", lead_id AS "leadId",
        channel, status, attempts, error_code AS "errorCode", available_at::text AS "availableAt",
        lease_until::text AS "leaseUntil", created_at::text AS "createdAt", updated_at::text AS "updatedAt"
        FROM public.lead_notification_deliveries
        WHERE status IN ('uncertain','dead','blocked','retry','leased','pending')
        ORDER BY CASE status WHEN 'uncertain' THEN 0 WHEN 'dead' THEN 1 WHEN 'blocked' THEN 2 ELSE 3 END,
          updated_at, id LIMIT 50`);
      const totals = summary.rows[0];
      if (!totals || typeof totals.due !== "number" || typeof totals.expired_leases !== "number") throw new Error("queue_health_invalid");
      return { ...base, state: "ready" as const, observedAt: row.observed_at,
        counts: counts.rows as QueueCount[], due: totals.due, expiredLeases: totals.expired_leases,
        oldestDueAt: typeof totals.oldest_due_at === "string" ? totals.oldest_due_at : null,
        entries: entries.rows as QueueEntry[] };
    }, { isolationLevel: "repeatable read" });
  } catch {
    // Missing connectivity/schema privileges must never look like an empty healthy queue.
    return base;
  }
}
