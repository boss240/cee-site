import { randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { deliverTarget } from "./deliveryAdapter";
import type { DeliveryChannel } from "./outboxTargets";

export type ClaimedDelivery = {
  id: string; event_id: string; lead_id: number | null; channel: DeliveryChannel;
  recipient: string; attempts: number; lease_token: string;
};
const MAX_ATTEMPTS = 6;
type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
async function boundedTransaction<T>(work: (tx: Transaction) => Promise<T>): Promise<T> {
  return db.transaction(async tx => {
    await tx.execute(sql`SET LOCAL lock_timeout = '2s'`);
    await tx.execute(sql`SET LOCAL statement_timeout = '5s'`);
    return work(tx);
  });
}

export function retryDelaySeconds(attempts: number, retryAfterSeconds = 0): number {
  return Math.min(86400, Math.max(Math.min(900, 15 * 2 ** Math.max(0, attempts - 1)),
    Number.isFinite(retryAfterSeconds) ? retryAfterSeconds : 0));
}

/** One claim at a time: no batch waits can exhaust an already-acquired lease. DB time only. */
export async function claimDelivery(): Promise<ClaimedDelivery | null> {
  const token = randomUUID();
  return boundedTransaction(async tx => {
    // A crashed sender may already have handed off to a provider: never automatically resend it.
    await tx.execute(sql`UPDATE lead_notification_deliveries SET status='uncertain',
      error_code='lease_expired', lease_token=NULL, lease_until=NULL, updated_at=clock_timestamp()
      WHERE id IN (SELECT id FROM lead_notification_deliveries
        WHERE status='leased' AND lease_until <= clock_timestamp()
        ORDER BY lease_until LIMIT 50 FOR UPDATE SKIP LOCKED)`);
    const result = await tx.execute(sql`WITH candidate AS (
      SELECT id FROM lead_notification_deliveries
      WHERE status IN ('pending','retry') AND available_at <= clock_timestamp() AND attempts < ${MAX_ATTEMPTS}
      ORDER BY available_at, created_at, id FOR UPDATE SKIP LOCKED LIMIT 1
    ) UPDATE lead_notification_deliveries AS d SET status='leased', attempts=d.attempts+1,
      lease_token=${token}::uuid, lease_until=clock_timestamp()+interval '90 seconds', updated_at=clock_timestamp()
      FROM candidate WHERE d.id=candidate.id RETURNING d.*`);
    return (result.rows[0] as ClaimedDelivery | undefined) ?? null;
  });
}

export async function dispatchNotifications() {
  if (process.env.CEE_NOTIFICATION_OUTBOX_DISPATCH !== "true") return { disabled: true, processed: 0 };
  const started = Date.now();
  let processed = 0;
  // Provider timeout is bounded; one invocation sends at most two targets and starts no work after 35s.
  while (processed < 2 && Date.now() - started < 35_000) {
    const job = await claimDelivery();
    if (!job) break;
    let outcome: Awaited<ReturnType<typeof deliverTarget>>;
    try {
      const [lead] = job.lead_id === null ? [] : await boundedTransaction(tx => tx.select({
        id: schema.leads.id, name: schema.leads.name, email: schema.leads.email,
        phone: schema.leads.phone, segment: schema.leads.segment, message: schema.leads.message,
        source: schema.leads.source, page: schema.leads.page, locale: schema.leads.locale,
        createdAt: schema.leads.createdAt,
      }).from(schema.leads).where(eq(schema.leads.id, job.lead_id!)).limit(1));
      // Recheck the fence immediately before handoff. A stalled worker must not knowingly send late.
      const ownership = await boundedTransaction(tx => tx.execute(sql`SELECT id FROM lead_notification_deliveries
        WHERE id=${job.id}::uuid AND status='leased' AND lease_token=${job.lease_token}::uuid
          AND lease_until > clock_timestamp()+interval '45 seconds'`));
      if (!ownership.rows.length) { processed++; continue; }
      // No transcript read or duplicate payload; deleted leads never recreate or notify.
      outcome = lead ? await deliverTarget(job, { ...lead, source: lead.source as "form" | "chat", transcript: null })
        : { status: "cancelled", code: "lead_deleted" };
    } catch {
      // Includes unknown handoff outcome. Raw errors may contain secrets/PII and are never logged.
      outcome = { status: "uncertain", code: "worker_outcome_unknown" };
    }
    const status = outcome.status === "retry" && job.attempts >= MAX_ATTEMPTS ? "dead" : outcome.status;
    const code = status === "dead" && outcome.status === "retry" ? "retry_exhausted" : outcome.code;
    const delay = retryDelaySeconds(job.attempts, outcome.retryAfterSeconds);
    // Fenced settle: late workers cannot overwrite an expired/reconciled lease. No automatic resend on failure.
    const settled = await boundedTransaction(tx => tx.execute(sql`UPDATE lead_notification_deliveries
      SET status=${status}, error_code=${code}, available_at=clock_timestamp()+${delay}*interval '1 second',
      lease_token=NULL, lease_until=NULL, updated_at=clock_timestamp()
      WHERE id=${job.id}::uuid AND status='leased' AND lease_token=${job.lease_token}::uuid
        AND lease_until > clock_timestamp() RETURNING id`));
    console.info(JSON.stringify({ event: "notification_delivery_settled", deliveryId: job.id,
      status: settled.rows.length ? status : "uncertain", attempt: job.attempts }));
    processed++;
  }
  return { disabled: false, processed };
}
