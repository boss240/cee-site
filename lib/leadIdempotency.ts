import { createHash, randomUUID } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "./db";

import { notificationTargets } from "./notify/outboxTargets";

type LeadInsert = typeof schema.leads.$inferInsert;
export type LeadSubmission = Pick<LeadInsert, "name" | "email" | "phone" | "segment" | "message" | "source" | "page" | "locale" | "transcript">;

export class LeadSubmissionError extends Error {
  constructor(public readonly code: "idempotency_conflict" | "rate_limited") {
    super(code);
  }
}

export function leadPayloadHash(data: LeadSubmission): string {
  // Explicit order and defaults make semantically identical validated bodies equal.
  const canonical = JSON.stringify({
    name: data.name, email: data.email || null, phone: data.phone || null,
    segment: data.segment || null, message: data.message || "", source: data.source || "form",
    page: data.page || null, locale: data.locale || null, transcript: data.transcript ?? null,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

/** One transaction owns both the lead and its replay receipt. No network side effects here. */
export async function storeLeadOnce(key: string, data: LeadSubmission, admitNew: () => boolean) {
  const keyHash = createHash("sha256").update(key.toLowerCase()).digest("hex");
  const payloadHash = leadPayloadHash(data);
  return db.transaction(async tx => {
    // Bound lock waiting and statements; a failure rolls back rather than retrying an uncertain write.
    await tx.execute(sql`SET LOCAL lock_timeout = '5s'`);
    await tx.execute(sql`SET LOCAL statement_timeout = '10s'`);
    // Transaction-scoped and shared by all replicas. A hash collision only serializes unrelated requests.
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtextextended(${keyHash}, 0))`);
    const [receipt] = await tx.select().from(schema.leadSubmissions)
      .where(eq(schema.leadSubmissions.keyHash, keyHash)).limit(1);
    if (receipt) {
      if (receipt.payloadHash !== payloadHash) throw new LeadSubmissionError("idempotency_conflict");
      return { created: null, id: receipt.leadId, replayed: true };
    }
    if (!admitNew()) throw new LeadSubmissionError("rate_limited");
    const [created] = await tx.insert(schema.leads).values(data).returning();
    await tx.insert(schema.leadSubmissions).values({ keyHash, payloadHash, leadId: created.id });
    // Capture and delivery activation are deliberately independent. Dispatcher off retains work.
    // Default capture off preserves the prior manual/legacy flow until the additive schema is reviewed.
    const notificationsQueued = process.env.CEE_NOTIFICATION_OUTBOX_CAPTURE === "true";
    if (notificationsQueued) {
      const eventId = randomUUID();
      for (const target of notificationTargets(created.email, process.env)) {
        await tx.execute(sql`INSERT INTO lead_notification_deliveries
          (event_id, lead_id, channel, recipient, status, error_code)
          VALUES (${eventId}::uuid, ${created.id}, ${target.channel}, ${target.recipient}, ${target.status}, ${target.code})`);
      }
    }
    return { created, id: created.id, replayed: false, notificationsQueued };
  });
}
