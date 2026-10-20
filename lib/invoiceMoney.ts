import { z } from "zod";
// Validate supported ISO currency identifiers, not provider/merchant capabilities.
const currencies = new Set(Intl.supportedValuesOf("currency"));
export const invoiceMoney = z.object({
  amount: z.number().finite().positive().max(Number.MAX_SAFE_INTEGER),
  currency: z.string().regex(/^[A-Z]{3}$/).refine(value => currencies.has(value), "Unsupported currency code"),
});
// No coercion or rounding. Provider-specific minor-unit limits require a separate contract.
