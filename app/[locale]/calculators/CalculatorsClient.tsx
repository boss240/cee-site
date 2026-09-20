"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Battery, TrendingUp, Landmark, Zap } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { bessDispatch, bessEco, bessVerdict, rdnProfile, loadProfile } from "@/lib/calc/bess";
import { arbitrage, type ArbProfile } from "@/lib/calc/arbitrage";
import { finance } from "@/lib/calc/finance";
import { expressBess, expressSolar, expressDsm } from "@/lib/calc/express";

type Tab = "bess" | "arb" | "finance" | "express";
const TABS: { id: Tab; Icon: typeof Battery }[] = [
  { id: "bess", Icon: Battery },
  { id: "arb", Icon: TrendingUp },
  { id: "finance", Icon: Landmark },
  { id: "express", Icon: Zap },
];

const field = "w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-[var(--color-fg)] transition focus:border-[var(--color-brand-dark)] focus:bg-[var(--color-bg)]";
const card = "rounded-xl border border-[var(--color-line)] bg-[var(--color-bg)] p-5";
const verdictCls: Record<string, string> = { loss: "text-red-500", high: "text-[var(--color-brand-text)]", ok: "text-amber-500", long: "text-red-500" };

function Num({ id, label, unit, value, onChange, step = 1, min = 0 }: { id: string; label: string; unit?: string; value: number; onChange: (v: number) => void; step?: number; min?: number }) {
  return (
    <label htmlFor={id} className="block">
      <span className="mb-1 block text-xs font-semibold text-[var(--color-fg-muted)]">{label}{unit ? <span className="ml-1 font-normal text-[var(--color-fg-placeholder)]">({unit})</span> : null}</span>
      <input id={id} type="number" inputMode="decimal" className={field} value={Number.isFinite(value) ? value : ""} step={step} min={min} onChange={(e) => onChange(parseFloat(e.target.value) || 0)} />
    </label>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] p-3">
      <dt className="text-xs text-[var(--color-fg-muted)]">{label}</dt>
      <dd className={`mt-1 text-lg font-bold tabular-nums ${accent ? "text-[var(--color-brand-text)]" : ""}`}>{value}</dd>
    </div>
  );
}

/** Простий SVG-графік: стовпчики заряд/розряд і лінія SOC/ціни */
function HourChart({ bars, line, lineMax, negLabel, posLabel, lineLabel }: { bars: { neg: number; pos: number }[]; line: number[]; lineMax: number; negLabel: string; posLabel: string; lineLabel: string }) {
  const W = 720, H = 200, padL = 28, padB = 22, top = 10;
  const maxBar = Math.max(1, ...bars.map((b) => Math.max(b.neg, b.pos)));
  const zeroY = top + (H - top - padB) / 2;
  const scale = (H - top - padB) / 2 / maxBar;
  const bw = (W - padL) / 24;
  const linePts = line.map((v, i) => `${padL + i * bw + bw / 2},${top + (H - top - padB) * (1 - Math.min(v, lineMax) / lineMax)}`).join(" ");
  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`${negLabel} / ${posLabel} / ${lineLabel}`}>
        <line x1={padL} x2={W} y1={zeroY} y2={zeroY} stroke="currentColor" strokeOpacity="0.2" />
        {bars.map((b, i) => (
          <g key={i}>
            {b.pos > 0 && <rect x={padL + i * bw + 2} y={zeroY - b.pos * scale} width={bw - 4} height={b.pos * scale} fill="#10b981" opacity="0.85" />}
            {b.neg > 0 && <rect x={padL + i * bw + 2} y={zeroY} width={bw - 4} height={b.neg * scale} fill="#3b82f6" opacity="0.75" />}
            {i % 3 === 0 && <text x={padL + i * bw + bw / 2} y={H - 6} fontSize="9" textAnchor="middle" fill="currentColor" opacity="0.5">{i}</text>}
          </g>
        ))}
        <polyline points={linePts} fill="none" stroke="#f59e0b" strokeWidth="2" />
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-4 text-xs text-[var(--color-fg-muted)]">
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#3b82f6]" />{negLabel}</span>
        <span><i className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#10b981]" />{posLabel}</span>
        <span><i className="mr-1 inline-block h-0.5 w-3 bg-[#f59e0b] align-middle" />{lineLabel}</span>
      </figcaption>
    </figure>
  );
}

export function CalculatorsClient({ initialTab }: { initialTab: Tab }) {
  const t = useTranslations("Calculators");
  const locale = useLocale();
  const [tab, setTab] = useState<Tab>(initialTab);
  const fmt = (n: number, d = 0) => n.toLocaleString(locale === "en" ? "en-GB" : "uk-UA", { maximumFractionDigits: d, minimumFractionDigits: d });
  const uah = (n: number) => `₴ ${fmt(n)}`;

  // ---- BESS ----
  const [b, setB] = useState({ cap: 200, inv: 100, gridLim: 100, rdnLim: 50, nCharge: 4, nDischarge: 4, gridFee: 5.3, capexPer: 8000, eff: 92.7, night: 8700, half: 1250, peak: 8700, loadD: 50, loadE: 53, loadN: 30 });
  const bess = useMemo(() => {
    const p = { cap: b.cap, inv: b.inv, gridLim: b.gridLim, rdnLim: b.rdnLim, nCharge: b.nCharge, nDischarge: b.nDischarge, gridFee: b.gridFee, capexPer: b.capexPer, eff: b.eff / 100 };
    const disp = bessDispatch(p, rdnProfile(b.night, b.half, b.peak), loadProfile(b.loadD, b.loadE, b.loadN));
    return { disp, eco: bessEco(p, disp) };
  }, [b]);
  const bv = bessVerdict(bess.eco);

  // ---- Arbitrage ----
  const [a, setA] = useState({ gridLimit: 80, baseLoad: 30, profile: "office" as ArbProfile, gridFee: 5.3, capexUsd: 280 });
  const arb = useMemo(() => arbitrage({ gridLimit: a.gridLimit, baseLoad: a.baseLoad, profile: a.profile, gridFee: a.gridFee, capexUsdPerKwh: a.capexUsd }), [a]);
  const av = arb.dailyP <= 0 ? "loss" : arb.payback <= 4.5 ? "high" : arb.payback <= 7 ? "ok" : "long";

  // ---- Finance ----
  const [f, setF] = useState({ amount: 500, rate: 6, years: 7, savings: 120 });
  const fin = useMemo(() => finance({ amount: f.amount * 1000, ratePct: f.rate, years: f.years, annualSavings: f.savings * 1000 }), [f]);

  // ---- Express ----
  const [e1, setE1] = useState({ cons: 100, peak: 200, tariff: 5.3, done: false });
  const [e2, setE2] = useState({ area: 500, day: 60, tariff: 5.3, done: false });
  const [e3, setE3] = useState({ cons: 100, shift: 30, diff: 3, done: false });
  const x1 = expressBess(e1.cons, e1.peak, e1.tariff), x2 = expressSolar(e2.area, e2.day, e2.tariff), x3 = expressDsm(e3.cons, e3.shift, e3.diff);

  const cta = (key: Tab) => (
    <Link href={`/contacts?topic=calc-${key}`} className="mt-5 inline-flex h-11 items-center justify-center rounded-lg bg-[var(--color-brand)] px-6 font-semibold text-white transition hover:bg-[var(--color-brand-hover)]">
      {t(`cta.${key}`)}
    </Link>
  );
  const bindB = (k: keyof typeof b) => (v: number) => setB((s) => ({ ...s, [k]: v }));
  const u = (k: string) => t(`units.${k}`);

  return (
    <div>
      <div role="tablist" aria-label={t("title")} className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none]">
        {TABS.map(({ id, Icon }) => (
          <button key={id} role="tab" type="button" aria-selected={tab === id} onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold transition ${tab === id ? "border-[var(--color-brand)] bg-[var(--color-brand)] text-white" : "border-[var(--color-line)] text-[var(--color-fg-muted)] hover:bg-[var(--color-surface)]"}`}>
            <Icon size={16} aria-hidden />{t(`tabs.${id}`)}
          </button>
        ))}
      </div>

      {tab === "bess" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <div><h2 className="text-xl">{t("bess.title")}</h2><p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t("bess.text")}</p></div>
            <div className={card}>
              <p className="mono-label mb-3 text-[var(--color-brand-text)]">{t("bess.groups.params")}</p>
              <div className="grid grid-cols-2 gap-3">
                <Num id="b-cap" label={t("bess.fields.cap")} unit={u("kwh")} value={b.cap} onChange={bindB("cap")} step={10} />
                <Num id="b-inv" label={t("bess.fields.inv")} unit={u("kw")} value={b.inv} onChange={bindB("inv")} step={5} />
                <Num id="b-grid" label={t("bess.fields.gridLim")} unit={u("kw")} value={b.gridLim} onChange={bindB("gridLim")} step={5} />
                <Num id="b-rdn" label={t("bess.fields.rdnLim")} unit={u("kw")} value={b.rdnLim} onChange={bindB("rdnLim")} step={5} />
                <Num id="b-nc" label={t("bess.fields.nCharge")} unit={u("h")} value={b.nCharge} onChange={bindB("nCharge")} />
                <Num id="b-nd" label={t("bess.fields.nDischarge")} unit={u("h")} value={b.nDischarge} onChange={bindB("nDischarge")} />
                <Num id="b-gf" label={t("bess.fields.gridFee")} unit={u("uahKwh")} value={b.gridFee} onChange={bindB("gridFee")} step={0.1} />
                <Num id="b-cx" label={t("bess.fields.capexPer")} unit={u("uah")} value={b.capexPer} onChange={bindB("capexPer")} step={100} />
                <Num id="b-eff" label={t("bess.fields.eff")} unit={u("pct")} value={b.eff} onChange={bindB("eff")} step={0.1} />
              </div>
            </div>
            <div className={card}>
              <p className="mono-label mb-3 text-[var(--color-brand-text)]">{t("bess.groups.rdn")}</p>
              <div className="grid grid-cols-3 gap-3">
                <Num id="b-night" label={t("bess.fields.night")} unit={u("uahMwh")} value={b.night} onChange={bindB("night")} step={50} />
                <Num id="b-half" label={t("bess.fields.half")} unit={u("uahMwh")} value={b.half} onChange={bindB("half")} step={50} />
                <Num id="b-peak" label={t("bess.fields.peak")} unit={u("uahMwh")} value={b.peak} onChange={bindB("peak")} step={50} />
              </div>
              <p className="mt-2 text-xs text-[var(--color-fg-placeholder)]">{t("bess.rdnHint")}</p>
            </div>
            <div className={card}>
              <p className="mono-label mb-3 text-[var(--color-brand-text)]">{t("bess.groups.load")}</p>
              <div className="grid grid-cols-3 gap-3">
                <Num id="b-ld" label={t("bess.fields.loadD")} unit={u("kw")} value={b.loadD} onChange={bindB("loadD")} />
                <Num id="b-le" label={t("bess.fields.loadE")} unit={u("kw")} value={b.loadE} onChange={bindB("loadE")} />
                <Num id="b-ln" label={t("bess.fields.loadN")} unit={u("kw")} value={b.loadN} onChange={bindB("loadN")} />
              </div>
              <p className="mt-2 text-xs text-[var(--color-fg-placeholder)]">{t("bess.loadHint")}</p>
            </div>
          </div>
          <div className={`${card} lg:sticky lg:top-24 lg:self-start`}>
            <p className={`text-lg font-bold ${verdictCls[bv]}`}>{t(`verdict.${bv}`, { pay: bess.eco.pay.toFixed(1) })}</p>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{t("bess.dispatch", { c: bess.eco.chargeHours, d: bess.eco.dischargeHours })}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label={t("bess.results.daily")} value={uah(bess.eco.daily)} accent />
              <Stat label={t("bess.results.yearly")} value={uah(bess.eco.yearly)} accent />
              <Stat label={t("bess.results.capex")} value={uah(bess.eco.capex)} />
              <Stat label={t("bess.results.pay")} value={bess.eco.pay > 0 ? `${bess.eco.pay.toFixed(1)} ${u("years")}` : "—"} />
              <Stat label={t("bess.results.npv")} value={`${bess.eco.npv >= 0 ? "+" : ""}${uah(bess.eco.npv)}`} />
              <Stat label={t("bess.results.irr")} value={`${(bess.eco.irr * 100).toFixed(1)}%`} />
              <Stat label={t("bess.results.cycEff")} value={`${(bess.eco.cycEff * 100).toFixed(1)}%`} />
              <Stat label={t("bess.results.yld")} value={`${bess.eco.yld.toFixed(2)} ${u("uahKwh")}`} />
            </dl>
            <p className="mt-5 text-sm font-semibold">{t("bess.chartTitle")}</p>
            <HourChart bars={bess.disp.map((r) => ({ neg: r.cG, pos: r.dL + r.dR }))} line={bess.disp.map((r) => r.socP * 100)} lineMax={100} negLabel={t("bess.legend.charge")} posLabel={t("bess.legend.discharge")} lineLabel={t("bess.legend.soc")} />
            {cta("bess")}
          </div>
        </section>
      )}

      {tab === "arb" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <div><h2 className="text-xl">{t("arb.title")}</h2><p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t("arb.text")}</p></div>
            <div className={`${card} grid grid-cols-2 gap-3`}>
              <Num id="a-grid" label={t("arb.fields.gridLimit")} unit={u("kw")} value={a.gridLimit} onChange={(v) => setA((s) => ({ ...s, gridLimit: v }))} step={5} />
              <Num id="a-load" label={t("arb.fields.baseLoad")} unit={u("kw")} value={a.baseLoad} onChange={(v) => setA((s) => ({ ...s, baseLoad: v }))} step={5} />
              <label htmlFor="a-profile" className="col-span-2 block">
                <span className="mb-1 block text-xs font-semibold text-[var(--color-fg-muted)]">{t("arb.fields.profile")}</span>
                <select id="a-profile" className={field} value={a.profile} onChange={(e) => setA((s) => ({ ...s, profile: e.target.value as ArbProfile }))}>
                  {(["office", "shift", "flat"] as const).map((p) => <option key={p} value={p}>{t(`arb.profiles.${p}`)}</option>)}
                </select>
              </label>
              <Num id="a-gf" label={t("arb.fields.gridFee")} unit={u("uahKwh")} value={a.gridFee} onChange={(v) => setA((s) => ({ ...s, gridFee: v }))} step={0.1} />
              <Num id="a-cx" label={t("arb.fields.capexUsd")} unit={u("usdKwh")} value={a.capexUsd} onChange={(v) => setA((s) => ({ ...s, capexUsd: v }))} step={10} />
            </div>
          </div>
          <div className={`${card} lg:sticky lg:top-24 lg:self-start`}>
            <p className={`text-lg font-bold ${verdictCls[av]}`}>{t(`verdict.${av}`, { pay: arb.payback.toFixed(1) })}</p>
            <p className="mt-1 text-xs text-[var(--color-fg-muted)]">{t("arb.details", { cycles: arb.cycles.toFixed(2), pct: arb.intPct })}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Stat label={t("arb.results.inv")} value={`${arb.invKw} ${u("kw")}`} />
              <Stat label={t("arb.results.cap")} value={`${arb.capKwh} ${u("kwh")}`} />
              <Stat label={t("arb.results.yearly")} value={uah(Math.max(0, arb.yearlyP))} accent />
              <Stat label={t("arb.results.intRev")} value={uah(arb.intRev)} />
              <Stat label={t("arb.results.extRev")} value={uah(arb.extRev)} />
              <Stat label={t("arb.results.chargeCost")} value={uah(arb.chargeCost)} />
              <Stat label={t("arb.results.capex")} value={`$ ${fmt(arb.capexUsd)} · ${uah(arb.capexUah)}`} />
              <Stat label={t("arb.results.payback")} value={arb.payback > 0 ? `${arb.payback.toFixed(1)} ${u("years")}` : "—"} />
            </dl>
            <p className="mt-5 text-sm font-semibold">{t("arb.chartTitle")}</p>
            <HourChart bars={arb.hours.map((h) => ({ neg: h.charge, pos: h.disInt + h.disExt }))} line={arb.hours.map((h) => h.price)} lineMax={Math.max(...arb.hours.map((h) => h.price)) * 1.1} negLabel={t("bess.legend.charge")} posLabel={t("bess.legend.discharge")} lineLabel={`${u("uahKwh")} (РДН)`} />
            {cta("arb")}
          </div>
        </section>
      )}

      {tab === "finance" && (
        <section className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-5">
            <div><h2 className="text-xl">{t("finance.title")}</h2><p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t("finance.text")}</p></div>
            <div className={`${card} grid grid-cols-2 gap-3`}>
              <Num id="f-amt" label={t("finance.fields.amount")} unit={u("kUah")} value={f.amount} onChange={(v) => setF((s) => ({ ...s, amount: v }))} step={10} />
              <Num id="f-rate" label={t("finance.fields.rate")} unit={u("pct")} value={f.rate} onChange={(v) => setF((s) => ({ ...s, rate: v }))} step={0.5} />
              <Num id="f-years" label={t("finance.fields.years")} unit={u("years")} value={f.years} onChange={(v) => setF((s) => ({ ...s, years: v }))} min={1} />
              <Num id="f-sav" label={t("finance.fields.savings")} unit={u("kUahYear")} value={f.savings} onChange={(v) => setF((s) => ({ ...s, savings: v }))} step={10} />
            </div>
          </div>
          <div className={card}>
            <p className={`text-lg font-bold ${fin.withinTerm ? "text-[var(--color-brand-text)]" : "text-amber-500"}`}>{fin.withinTerm ? t("finance.ok") : t("finance.warn")}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3">
              <Stat label={t("finance.results.monthly")} value={uah(fin.monthly)} accent />
              <Stat label={t("finance.results.total")} value={uah(fin.total)} />
              <Stat label={t("finance.results.overpay")} value={uah(fin.overpay)} />
              <Stat label={t("finance.results.savings")} value={uah(f.savings * 1000)} />
              <Stat label={t("finance.results.payback")} value={fin.payback < 50 ? `${fin.payback.toFixed(1)} ${u("years")}` : "> 50"} />
            </dl>
            {cta("finance")}
          </div>
        </section>
      )}

      {tab === "express" && (
        <section className="mt-6">
          <h2 className="text-xl">{t("express.title")}</h2>
          <p className="mt-2 text-sm text-[var(--color-fg-muted)]">{t("express.text")}</p>
          <div className="mt-5 grid gap-5 md:grid-cols-3">
            <div className={card}>
              <h3>{t("express.bess.title")}</h3>
              <div className="mt-3 space-y-3">
                <Num id="x1-c" label={t("express.bess.cons")} unit={u("mwhMonth")} value={e1.cons} onChange={(v) => setE1((s) => ({ ...s, cons: v }))} />
                <Num id="x1-p" label={t("express.bess.peak")} unit={u("kw")} value={e1.peak} onChange={(v) => setE1((s) => ({ ...s, peak: v }))} />
                <Num id="x1-t" label={t("express.bess.tariff")} unit={u("uahKwh")} value={e1.tariff} onChange={(v) => setE1((s) => ({ ...s, tariff: v }))} step={0.1} />
              </div>
              <button type="button" onClick={() => setE1((s) => ({ ...s, done: true }))} className="mt-4 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white">{t("express.bess.run")}</button>
              {e1.done && (
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.bess.out.size")}</dt><dd className="font-semibold">{fmt(x1.bessKwh)} {u("kwh")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.bess.out.peak")}</dt><dd className="font-semibold">~{uah(x1.peakShaveMonth)}{t("perMonth")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.bess.out.arb")}</dt><dd className="font-semibold">~{uah(x1.arbYear)}{t("perYear")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.bess.out.total")}</dt><dd className="font-bold text-[var(--color-brand-text)]">~{uah(x1.yearly)}{t("perYear")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.bess.out.payback")}</dt><dd className="font-semibold">~{x1.payback.toFixed(1)} {u("years")}</dd></div>
                </dl>
              )}
            </div>
            <div className={card}>
              <h3>{t("express.solar.title")}</h3>
              <div className="mt-3 space-y-3">
                <Num id="x2-a" label={t("express.solar.area")} unit={u("m2")} value={e2.area} onChange={(v) => setE2((s) => ({ ...s, area: v }))} step={10} />
                <Num id="x2-d" label={t("express.solar.day")} unit={u("pct")} value={e2.day} onChange={(v) => setE2((s) => ({ ...s, day: v }))} />
                <Num id="x2-t" label={t("express.solar.tariff")} unit={u("uahKwh")} value={e2.tariff} onChange={(v) => setE2((s) => ({ ...s, tariff: v }))} step={0.1} />
              </div>
              <button type="button" onClick={() => setE2((s) => ({ ...s, done: true }))} className="mt-4 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white">{t("express.solar.run")}</button>
              {e2.done && (
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.solar.out.kwp")}</dt><dd className="font-semibold">~{fmt(x2.kwp)} {u("kw")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.solar.out.gen")}</dt><dd className="font-semibold">~{fmt(x2.gen)} {u("kwh")}{t("perYear")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.solar.out.self")}</dt><dd className="font-semibold">~{fmt(x2.selfUse)} {u("kwh")}{t("perYear")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.solar.out.save")}</dt><dd className="font-bold text-[var(--color-brand-text)]">~{uah(x2.save)}{t("perYear")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.solar.out.capex")}</dt><dd className="font-semibold">~{uah(x2.capex)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.solar.out.payback")}</dt><dd className="font-semibold">~{x2.payback.toFixed(1)} {u("years")}</dd></div>
                </dl>
              )}
            </div>
            <div className={card}>
              <h3>{t("express.dsm.title")}</h3>
              <div className="mt-3 space-y-3">
                <Num id="x3-c" label={t("express.dsm.cons")} unit={u("mwhMonth")} value={e3.cons} onChange={(v) => setE3((s) => ({ ...s, cons: v }))} />
                <Num id="x3-s" label={t("express.dsm.shift")} unit={u("pct")} value={e3.shift} onChange={(v) => setE3((s) => ({ ...s, shift: v }))} />
                <Num id="x3-d" label={t("express.dsm.diff")} unit={u("uahKwh")} value={e3.diff} onChange={(v) => setE3((s) => ({ ...s, diff: v }))} step={0.1} />
              </div>
              <button type="button" onClick={() => setE3((s) => ({ ...s, done: true }))} className="mt-4 w-full rounded-lg bg-[var(--color-brand)] px-4 py-2.5 text-sm font-semibold text-white">{t("express.dsm.run")}</button>
              {e3.done && (
                <dl className="mt-4 space-y-1.5 text-sm">
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.dsm.out.shifted")}</dt><dd className="font-semibold">{fmt(x3.shifted)} {u("kwh")}{t("perMonth")}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.dsm.out.month")}</dt><dd className="font-bold text-[var(--color-brand-text)]">~{uah(x3.saveMonth)}</dd></div>
                  <div className="flex justify-between gap-2"><dt className="text-[var(--color-fg-muted)]">{t("express.dsm.out.year")}</dt><dd className="font-semibold">~{uah(x3.saveYear)}</dd></div>
                  <p className="pt-1 text-xs text-[var(--color-fg-placeholder)]">{t("express.dsm.out.capex")}</p>
                </dl>
              )}
            </div>
          </div>
          <p className="mt-4 text-xs text-[var(--color-fg-placeholder)]">{t("express.note")}</p>
          {cta("express")}
        </section>
      )}
    </div>
  );
}
