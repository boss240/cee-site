import type { z } from "zod";
import { sql } from "drizzle-orm";
import { db, schema } from "./db";
import type { invoiceCreate } from "./invoiceInput";

/** Exclusive owner-approved CEE-WEB-2026 series; historical INV numbers are untouched.
 * Provisioning zero certifies a new reserved series, NOT an inferred historical maximum.
 * Future-year series require a separate review; never auto-create/reset counters.
 */
export async function createNumberedInvoice(body: z.infer<typeof invoiceCreate>) {
  const year = new Date().getUTCFullYear();
  if (year !== 2026) throw new Error("Invoice series year not approved");
  return db.transaction(async tx => {
    await tx.execute(sql`SET LOCAL lock_timeout = '2s'`);
    await tx.execute(sql`SET LOCAL statement_timeout = '5s'`);
    const allocated = await tx.execute(sql`
      UPDATE invoice_number_counters SET last_number = last_number + 1
      WHERE year = ${year} AND last_number < 2147483647
      RETURNING last_number`);
    const n = allocated.rows[0]?.last_number;
    if (typeof n !== "number" || !Number.isInteger(n) || n < 1 || n > 2147483647) {
      throw new Error("Invoice numbering not provisioned or exhausted");
    }
    const number = `CEE-WEB-${year}-${String(n).padStart(6, "0")}`;
    const [created] = await tx.insert(schema.invoices).values({
      ...body, number, dueAt: body.dueAt ? new Date(body.dueAt) : null,
    }).returning();
    return created;
  }, { isolationLevel: "read committed" });
}
