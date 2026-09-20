/**
 * Модель диспетчеризації системи накопичення енергії (УЗЕ/BESS) на добовому профілі.
 * Логіка: N найдешевших годин РДН — заряд, N найдорожчих — розряд (спершу на власне
 * навантаження, надлишок — в мережу в межах ліміту видачі). Економіка: CAPEX, OPEX 2 %/рік,
 * деградація 1,5 %/рік, ставка дисконтування 18 %, горизонт 15 років.
 */
export type BessParams = {
  cap: number; // кВт·год
  inv: number; // кВт
  gridLim: number; // ліміт підведеної потужності, кВт
  rdnLim: number; // ліміт видачі в мережу, кВт
  nCharge: number; // годин заряду
  nDischarge: number; // годин розряду
  gridFee: number; // вартість електроенергії (тариф + розподіл), грн/кВт·год
  capexPer: number; // грн за кВт·год ємності
  eff: number; // ККД циклу, частка (0.927)
  socMin?: number;
  socMax?: number;
  socInit?: number;
  opexR?: number;
  deg?: number;
  disc?: number;
};

export type HourRow = { h: number; sig: "Z" | "D" | "P"; cG: number; dL: number; dR: number; eff_: number; soc: number; socP: number; price: number; load: number };

export function bessDispatch(p: BessParams, rdnP: number[], loadArr: number[]): HourRow[] {
  const { cap, inv, gridLim, rdnLim, eff, nCharge, nDischarge, gridFee: gf } = p;
  const socMin = p.socMin ?? 0.1, socMax = p.socMax ?? 1.0, socInit = p.socInit ?? 0.1;
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const ranked = hours.slice().sort((a, b) => rdnP[a] - rdnP[b]);
  const cheapH = new Set(ranked.slice(0, nCharge));
  const expH = new Set(ranked.slice().reverse().slice(0, nDischarge));
  let soc = socInit * cap;
  const res: HourRow[] = [];
  for (let h = 0; h < 24; h++) {
    const price = rdnP[h], load = loadArr[h];
    const sig: HourRow["sig"] = cheapH.has(h) ? "Z" : expH.has(h) ? "D" : "P";
    let cG = 0, dL = 0, dR = 0, imp = 0, costW = 0, expR = 0;
    const costNo = load * (price + gf);
    if (sig === "Z") {
      cG = Math.max(0, Math.min(inv, gridLim - load, (socMax * cap - soc) / eff));
      soc += cG * eff; imp = load + cG; costW = imp * (price + gf);
    } else if (sig === "D") {
      dL = Math.min(Math.min(inv, (soc - socMin * cap) * eff), load); soc -= dL / eff;
      dR = Math.max(0, Math.min(rdnLim, inv - dL, (soc - socMin * cap) * eff)); soc -= dR / eff;
      imp = Math.max(0, load - dL); costW = imp * (price + gf); expR = dR * price;
    } else { imp = load; costW = costNo; }
    res.push({ h: h + 1, sig, cG, dL, dR, eff_: costNo - costW + expR, soc, socP: soc / cap, price, load });
  }
  return res;
}

export type BessEco = { daily: number; yearly: number; capex: number; opex: number; net: number; pay: number; cycEff: number; yld: number; npv: number; irr: number; chargeHours: number; dischargeHours: number };

export function bessEco(p: BessParams, disp: HourRow[]): BessEco {
  const opexR = p.opexR ?? 0.02, deg = p.deg ?? 0.015, disc = p.disc ?? 0.18;
  const daily = disp.reduce((s, r) => s + r.eff_, 0);
  const tC = disp.reduce((s, r) => s + r.cG, 0);
  const tD = disp.reduce((s, r) => s + r.dL + r.dR, 0);
  const yearly = daily * 365, capex = p.cap * p.capexPer, opex = capex * opexR;
  const net = yearly - opex, pay = net > 0 ? capex / net : 0, cycEff = tC > 0 ? tD / tC : 0;
  let npv = -capex, capT = p.cap;
  const cfs = [-capex];
  for (let y = 1; y <= 15; y++) { capT *= 1 - deg; const ey = (capT / p.cap) * yearly - opex; cfs.push(ey); npv += ey / Math.pow(1 + disc, y); }
  let lo = -0.5, hi = 2;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; const n = cfs.reduce((s, cf, t) => s + cf / Math.pow(1 + mid, t), 0); if (n > 0) lo = mid; else hi = mid; }
  return { daily, yearly, capex, opex, net, pay, cycEff, yld: tC > 0 ? daily / tC : 0, npv, irr: (lo + hi) / 2, chargeHours: disp.filter((r) => r.cG > 0).length, dischargeHours: disp.filter((r) => r.dL + r.dR > 0).length };
}

/** Профіль цін РДН за трьома сегментами (грн/МВт·год → грн/кВт·год) */
export function rdnProfile(night: number, half: number, peak: number): number[] {
  const n = night / 1000, h = half / 1000, p = peak / 1000;
  return [n, n, n, n, n, n, n, h, h, h, h, h, h, h, h, h, h, p, p, p, p, p, p, n];
}
/** Профіль навантаження: день (8–17), вечір (18–22), ніч (23–7) */
export function loadProfile(day: number, evening: number, night: number): number[] {
  return [night, night, night, night, night, night, night, day, day, day, day, day, day, day, day, day, day, evening, evening, evening, evening, evening, night, night];
}

export function bessVerdict(eco: BessEco): "loss" | "high" | "ok" | "long" {
  if (eco.daily <= 0) return "loss";
  if (eco.pay <= 4) return "high";
  if (eco.pay <= 7) return "ok";
  return "long";
}
