/**
 * Експрес-оцінки «за 60 секунд». Це попередні орієнтири на типових коефіцієнтах,
 * а не ТЕО: точний розрахунок — після обстеження об'єкта.
 */
export function expressBess(consMwhMonth: number, peakKw: number, tariff: number) {
  const bessKwh = Math.round(peakKw * 2); // 2 год розряду на пік
  const peakShaveMonth = Math.round((peakKw * 0.3 * tariff * 30 * 4) / 1000) * 1000; // ~30 % піку, 4 год/день
  const arbYear = Math.round((bessKwh * 0.85 * 3.5 * 365) / 1000) * 1000; // спред ~3,5 грн
  const yearly = peakShaveMonth * 12 + arbYear;
  const capex = bessKwh * 4500;
  return { bessKwh, peakShaveMonth, arbYear, yearly, capex, payback: yearly > 0 ? capex / yearly : 0, consMwhMonth };
}

export function expressSolar(roofM2: number, daytimePct: number, tariff: number) {
  const kwp = Math.round(roofM2 / 7); // ~7 м² на 1 кВт
  const gen = Math.round(kwp * 1150); // кВт·год/рік для України
  const selfUse = Math.round((gen * Math.min(daytimePct, 95)) / 100);
  const save = Math.round((selfUse * tariff) / 1000) * 1000;
  const capex = kwp * 22000;
  return { kwp, gen, selfUse, save, capex, payback: save > 0 ? capex / save : 0 };
}

export function expressDsm(consMwhMonth: number, shiftPct: number, diffUah: number) {
  const shifted = (consMwhMonth * 1000 * shiftPct) / 100; // кВт·год/міс
  const saveMonth = Math.round((shifted * diffUah) / 1000) * 1000;
  return { shifted, saveMonth, saveYear: saveMonth * 12 };
}
