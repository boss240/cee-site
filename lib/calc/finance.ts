/** Ануїтетне фінансування заходу з енергоефективності: платіж, переплата, окупність з економії. */
export type FinanceInput = { amount: number; ratePct: number; years: number; annualSavings: number };
export type FinanceResult = { monthly: number; total: number; overpay: number; payback: number; withinTerm: boolean };

export function finance(i: FinanceInput): FinanceResult {
  if (!Object.values(i).every(Number.isFinite) || i.amount < 0 || i.ratePct < 0 || i.years <= 0 || i.annualSavings < 0) {
    throw new RangeError("Invalid financing inputs");
  }
  const rate = i.ratePct / 100 / 12, term = i.years * 12;
  const monthly = rate > 0 ? (i.amount * rate) / -Math.expm1(-term * Math.log1p(rate)) : i.amount / term;
  const total = monthly * term;
  const overpay = total - i.amount;
  const payback = i.annualSavings > 0 ? total / i.annualSavings : 999;
  return { monthly, total, overpay, payback, withinTerm: payback <= i.years };
}
