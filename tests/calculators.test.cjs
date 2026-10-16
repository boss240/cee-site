const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(name) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(`lib/calc/${name}.ts`, 'utf8'), {
    compilerOptions: {module: ts.ModuleKind.CommonJS},
  }).outputText, {exports});
  return exports;
}
const {finance} = load('finance');
const {arbitrage} = load('arbitrage');
const {bessDispatch, bessEco, bessVerdict, rdnProfile, loadProfile} = load('bess');
test('zero-interest loan preserves principal and invalid term is rejected', () => {
  const f = finance({amount:1200, ratePct:0, years:1, annualSavings:1200});
  assert.equal(f.monthly,100); assert.equal(f.total,1200);
  assert.throws(()=>finance({amount:1200,ratePct:6,years:0,annualSavings:1200}),/Invalid/);
  assert.ok(Number.isFinite(finance({amount:1e9,ratePct:100,years:100,annualSavings:1}).total));
});
test('no connected power cannot select a 10 kW inverter or divide by zero', () => {
  const a=arbitrage({gridLimit:0,baseLoad:0,profile:'flat',gridFee:5.3,capexUsdPerKwh:280});
  assert.equal(a.invKw,0); assert.equal(a.capKwh,0); assert.equal(a.cycles,0);
});
test('BESS verdict includes OPEX and per-stage losses preserve energy balance', () => {
  const p={cap:200,inv:100,gridLim:100,rdnLim:50,nCharge:4,nDischarge:4,gridFee:5.3,capexPer:100000,eff:.927};
  const d=bessDispatch(p,rdnProfile(8700,1250,8700),loadProfile(50,53,30));
  const e=bessEco(p,d);
  assert.ok(e.daily>0); assert.ok(e.net<0); assert.equal(bessVerdict(e),'loss');
  assert.ok(Math.abs(e.cycEff-.927**2)<1e-9);
  assert.ok(d.every(h=>h.soc >= p.cap*.1-1e-8 && h.soc<=p.cap+1e-8));
});

test('IRR solves known returns beyond old bracket and rejects absent or ambiguous roots', () => {
  const {investmentIrr} = load('bess');
  assert.ok(Math.abs(investmentIrr([-100,110])-.1)<1e-10);
  assert.ok(Math.abs(investmentIrr([-100,400])-3)<1e-10);
  assert.ok(Math.abs(investmentIrr([-100,50])+.5)<1e-10);
  assert.equal(investmentIrr([-100,-10]),null);
  assert.equal(investmentIrr([-100,0]),null);
  assert.equal(investmentIrr([-100,200,-110]),null);
  assert.equal(investmentIrr([-100,230,-132]),null); // two valid roots: 10% and 20%
  assert.equal(investmentIrr([0,100]),null);
});
test('express models reject invalid domains and cannot promise savings for zero consumption', () => {
  const {expressBess,expressSolar,expressDsm}=load('express');
  for (const [cons,peak] of [[0,200],[100,0]]) {
    const result=expressBess(cons,peak,5.3);
    assert.equal(result.yearly,0);assert.equal(result.feasible,false);
  }
  assert.throws(()=>expressBess(-1,10,5),/nonnegative/);
  assert.throws(()=>expressSolar(100,101,5),/100/);
  assert.throws(()=>expressDsm(10,Infinity,3),/finite/);
  assert.equal(expressDsm(0,30,3).saveYear,0);
  assert.equal(expressSolar(0,50,5).save,0);
});
