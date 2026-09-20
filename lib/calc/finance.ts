/** Ануїтетне фінансування заходу з енергоефективності: платіж, переплата, окупність з економії. */
export type FinanceInput = { amount: number; ratePct: number; years: number; annualSavings: number };
export type FinanceResult = { monthly: number; total: number; overpay: number; payback: number; withinTerm: boolean };

export function finance(i: FinanceInput): FinanceResult {
  const rate = i.ratePct / 100 / 12, term = i.years * 12;
  const monthly = rate > 0 ? (i.amount * (rate * Math.pow(1 + rate, term))) / (Math.pow(1 + rate, term) - 1) : i.amount / term;
  const total = monthly * term;
  const overpay = total - i.amount;
  const payback = i.annualSavings > 0 ? total / i.annualSavings : 999;
  return { monthly, total, overpay, payback, withinTerm: payback <= i.years };
}
