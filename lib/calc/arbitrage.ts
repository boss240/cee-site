/**
 * Арбітраж на ринку «на добу наперед» (РДН): ілюстративна евристика диспетчеризації.
 * Підбирає інвертор зі стандартного ряду під дозволену потужність, ємність = 4 × інвертор,
 * заряджає в найдешевші години (у межах ліміту), розряджає в найдорожчі — спершу на власне
 * навантаження, решту — на експорт. Ціни РДН — типовий добовий профіль (грн/кВт·год).
 */
export type ArbProfile = "flat" | "office" | "shift";
export type ArbInput = { gridLimit: number; baseLoad: number; profile: ArbProfile; gridFee: number; capexUsdPerKwh: number; usdRate?: number };
export type ArbResult = { invKw: number; capKwh: number; intRev: number; extRev: number; chargeCost: number; dailyP: number; yearlyP: number; capexUsd: number; capexUah: number; payback: number; balanced: boolean; feasible: boolean; cycles: number; intPct: number; hours: { h: number; price: number; load: number; charge: number; disInt: number; disExt: number }[] };

export const DAM_PROFILE = [1.5, 1.2, 1.1, 1.0, 1.2, 2.0, 4.5, 7.5, 8.5, 8.0, 6.5, 5.0, 4.5, 4.5, 5.0, 6.0, 7.5, 9.5, 10.0, 9.5, 8.0, 5.5, 3.0, 2.0];
const STD_INV = [10, 15, 20, 30, 50, 100, 150, 250, 500, 1000, 2000];

export function arbitrage(inp: ArbInput): ArbResult {
  const { gridLimit, baseLoad, profile, gridFee, capexUsdPerKwh } = inp;
  const usdRate = inp.usdRate ?? 41.5;
  if (![gridLimit, baseLoad, gridFee, capexUsdPerKwh, usdRate].every(v => Number.isFinite(v) && v >= 0) || !["flat", "office", "shift"].includes(profile)) throw new RangeError("Invalid arbitrage inputs");
  let invKw = 0;
  for (let i = STD_INV.length - 1; i >= 0; i--) if (STD_INV[i] <= gridLimit) { invKw = STD_INV[i]; break; }
  const capKwh = invKw * 4;
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const damP = DAM_PROFILE;
  const loadArr = hours.map((h) => (profile === "flat" ? baseLoad : profile === "office" ? (h >= 8 && h <= 18 ? baseLoad : baseLoad * 0.15) : h >= 7 && h <= 16 ? baseLoad : baseLoad * 0.1));
  const eff = 0.92, dod = 0.9;
  const usableCap = capKwh * dod;
  const chargeSch = new Array(24).fill(0), intDis = new Array(24).fill(0), extDis = new Array(24).fill(0);
  const cands = hours.slice().sort((a, b) => damP[a] - damP[b]);
  const toCharge = usableCap / eff;
  let charged = 0, chargeCost = 0;
  for (const hh of cands) {
    const mx = Math.min(invKw, gridLimit - loadArr[hh]); if (mx <= 0) continue;
    const ch = Math.min(mx, toCharge - charged); chargeSch[hh] = ch; charged += ch;
    chargeCost += ch * (damP[hh] + gridFee); if (charged >= toCharge) break;
  }
  const toDischarge = charged * eff;
  let intRev = 0, extRev = 0;
  const dcands = hours.slice().sort((a, b) => damP[b] - damP[a]);
  for (const hh of dcands) {
    if (chargeSch[hh] > 0) continue;
    const used = intDis.reduce((a, b) => a + b, 0) + extDis.reduce((a, b) => a + b, 0);
    if (used >= toDischarge) break;
    let avail = invKw, remain = toDischarge - used;
    const intPwr = Math.min(loadArr[hh], avail), intD = Math.min(intPwr, remain);
    intDis[hh] = intD; intRev += intD * (damP[hh] + gridFee); avail -= intD; remain -= intD;
    if (avail > 0 && remain > 0) { const expPwr = Math.min(gridLimit, avail), expD = Math.min(expPwr, remain); extDis[hh] = expD; extRev += expD * damP[hh]; }
  }
  // Ranked schedule is only a proposal: enforce causality and available stored energy.
  // eff is the round-trip efficiency here (unlike per-stage eff in the detailed model).
  let stored = 0;
  intRev = 0; extRev = 0;
  for (const h of hours) {
    stored += chargeSch[h] * eff;
    intDis[h] = Math.min(intDis[h], stored);
    stored = Math.max(0, stored - intDis[h]);
    extDis[h] = Math.min(extDis[h], stored);
    stored = Math.max(0, stored - extDis[h]);
    intRev += intDis[h] * (damP[h] + gridFee);
    extRev += extDis[h] * damP[h];
  }
  const feasible = loadArr.every(load => load <= gridLimit);
  const balanced = Math.abs(stored) <= Math.max(1, usableCap) * 1e-9;
  const dailyP = intRev + extRev - chargeCost;
  const yearlyP = balanced && feasible ? dailyP * 365 : 0;
  const capexUsd = capKwh * capexUsdPerKwh;
  const capexUah = capexUsd * usdRate;
  const payback = yearlyP > 0 ? capexUah / yearlyP : 0;
  const totalDis = intDis.reduce((a, b) => a + b, 0) + extDis.reduce((a, b) => a + b, 0);
  if (![dailyP, yearlyP, capexUsd, capexUah, payback, chargeCost, intRev, extRev].every(Number.isFinite)) throw new RangeError("Result exceeds numeric range");
  return {
    balanced, feasible, invKw, capKwh, intRev, extRev, chargeCost, dailyP, yearlyP, capexUsd, capexUah, payback,
    cycles: usableCap > 0 ? totalDis / usableCap : 0, intPct: Math.round((intRev / (intRev + extRev || 1)) * 100),
    hours: hours.map((h) => ({ h, price: damP[h], load: loadArr[h], charge: chargeSch[h], disInt: intDis[h], disExt: extDis[h] })),
  };
}
