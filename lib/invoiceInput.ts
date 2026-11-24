import { z } from "zod";
import { invoiceMoney } from "./invoiceMoney";

// Serial PostgreSQL IDs; reject coercion, fractional IDs and integer overflow.
export const invoiceId = z.string().regex(/^[1-9]\d*$/)
  .refine(value => Number(value) <= 2147483647, "Invalid invoice id")
  .transform(Number);

const fields = {
  clientName: z.string().trim().min(1).max(255),
  clientDetails: z.string().max(5000).nullable(),
  amount: invoiceMoney.shape.amount,
  currency: invoiceMoney.shape.currency,
  status: z.enum(["draft", "sent", "paid", "overdue"]),
  serviceDescription: z.string().max(10000),
};
const dueAt = z.union([z.iso.date(), z.iso.datetime({ offset: true }), z.literal("")]).nullable();

export const invoiceCreate = z.object({
  ...fields,
  clientDetails: fields.clientDetails.default(""),
  currency: fields.currency.default("UAH"),
  status: fields.status.default("draft"),
  serviceDescription: fields.serviceDescription.default(""),
  dueAt: dueAt.default(null),
});

// dueAt was never editable through PATCH; reject it rather than invent new semantics.
export const invoicePatch = z.object({ ...fields, dueAt: z.never().optional() })
  .partial().refine(value => Object.keys(value).length > 0, "No editable fields");
