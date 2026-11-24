function requireNonnegative(...values: number[]) {
  if (!values.every((v) => Number.isFinite(v) && v >= 0)) throw new RangeError("Inputs must be finite and nonnegative");
}
function requirePercentage(value: number) {
  requireNonnegative(value);
  if (value > 100) throw new RangeError("Percentage must not exceed 100");
}

/**
 * Експрес-оцінки «за 60 секунд». Це попередні орієнтири на типових коефіцієнтах,
 * а не ТЕО: точний розрахунок — після обстеження об'єкта.
 */
export function expressBess(consMwhMonth: number, peakKw: number, tariff: number) {
  requireNonnegative(consMwhMonth, peakKw, tariff);
  // Two-hour illustrative nameplate sizing, not an economic or engineering recommendation.
  const bessKwh = peakKw * 2;
  if (!Number.isFinite(bessKwh)) throw new RangeError("Result exceeds numeric range");
  return { bessKwh: consMwhMonth > 0 ? bessKwh : 0, consMwhMonth, feasible: consMwhMonth > 0 && peakKw > 0 };

}

export function expressSolar(roofM2: number, daytimePct: number, tariff: number) {
  requireNonnegative(roofM2, tariff);
  requirePercentage(daytimePct);
  const kwp = roofM2 / 7; // ~7 м² на 1 кВт
  const gen = kwp * 1150; // Illustrative specific yield, not a location-specific forecast
  const selfUse = gen * daytimePct / 100;
  const save = selfUse * tariff;
  const capex = kwp * 22000;
  requireNonnegative(kwp, gen, selfUse, save, capex, save > 0 ? capex / save : 0);
  return { kwp, gen, selfUse, save, capex, payback: save > 0 && capex > 0 ? capex / save : null };
}

export function expressDsm(consMwhMonth: number, shiftPct: number, diffUah: number) {
  requireNonnegative(consMwhMonth, diffUah);
  requirePercentage(shiftPct);
  const shifted = (consMwhMonth * 1000 * shiftPct) / 100; // кВт·год/міс
  const saveMonth = shifted * diffUah;
  requireNonnegative(shifted, saveMonth, saveMonth * 12);
  return { shifted, saveMonth, saveYear: saveMonth * 12 };
}
