import test from 'node:test';
import assert from 'node:assert/strict';
import {loadDiscovery} from './helpers/load-discovery.mjs';
const {analyzeElectricity,parseElectricityCsv,ELECTRICITY_CSV,ELECTRICITY_FIELDS,unitCost,consumptionUnits}=await loadDiscovery('electricity-discovery');
const rows=()=>parseElectricityCsv(ELECTRICITY_CSV).rows;
const change=(r,i,values)=>r.map((v,n)=>n===i?{...v,...values}:v);
const run=r=>analyzeElectricity(r);
const unknown=r=>r.map(v=>({...v,charge_basis:'unknown',fixed_usd:'',variable_usd:'',other_usd:''}));
test('example separates exact consumption, bill total, average cost and bill-identified charges',()=>{
 const r=run(rows());assert.equal(r.status,'ready');assert.equal(r.delta,2520);assert.equal(r.percent,'21%');assert.equal(r.findings.length,5);
 assert.match(r.findings.find(f=>f.id==='consumption').title,/60 kWh more/);assert.match(r.findings.find(f=>f.id==='unit-cost').detail,/\$0.2000/);assert.match(r.findings.find(f=>f.id==='unit-cost').title,/\$0.2200/);assert.deepEqual(r.changes.map(c=>c.delta),[0,2520,0]);
});
test('unit-cost display is exact rational rounding, not a tariff claim',()=>{
 assert.equal(unitCost(12000,600000),'$0.2000');assert.equal(unitCost(1,3000),'$0.0033');assert.equal(unitCost(1,200000),'$0.0001');assert.equal(unitCost(1,999999999999),'$0.00000000001');assert.equal(unitCost(0,1000),'$0.0000');assert.equal(unitCost(100,0),null);
 assert.match(run(rows()).findings.find(f=>f.id==='unit-cost').detail,/not the supplier’s tariff/);
});
test('unknown classifications do not invent zeros or a fixed-variable split',()=>{
 const r=run(unknown(rows()));assert.equal(r.status,'ready');assert.equal(r.findings.length,4);assert.deepEqual(r.changes,[]);assert.ok(!r.findings.some(f=>f.id==='components'));assert.match(r.findings.at(-1).title,/can’t identify/);
 for(const c of r.findings.at(-1).cells.filter(c=>['fixed_usd','variable_usd','other_usd'].includes(c.field)))assert.equal(c.used,'');
});
test('one unknown bill suppresses paired charge contributions without losing total or usage',()=>{
 const r=rows();r[1]=unknown(r)[1];const a=run(r);assert.equal(a.status,'ready');assert.equal(a.changes.length,0);assert.equal(a.delta,2520);
});
test('unknown classification with provided amounts is ambiguous and rejected',()=>{
 const a=run(change(rows(),0,{charge_basis:'unknown'}));assert.equal(a.status,'invalid');assert.match(a.issues[0].message,/leave the three/);
});
test('missing identified charges are not silently converted to zero',()=>{
 const a=run(change(rows(),0,{fixed_usd:''}));assert.equal(a.status,'invalid');assert.equal(a.findings.length,0);assert.match(a.issues[0].message,/explicit 0/);
});
test('a zero denominator preserves useful bill totals but has no average or consumption percent',()=>{
 const a=run(change(rows(),0,{consumption_kwh:'0'}));assert.equal(a.status,'ready');assert.match(a.findings.find(f=>f.id==='consumption').detail,/zero/);assert.match(a.findings.find(f=>f.id==='unit-cost').detail,/unavailable \(zero kWh\)/);
 const b=run(change(rows(),1,{consumption_kwh:'0'}));assert.match(b.findings.find(f=>f.id==='unit-cost').title,/needs nonzero/);assert.doesNotMatch(JSON.stringify(b),/NaN|Infinity/);
});
test('usage decimals are strict; missing, negative, locale, formula and more-than-three decimals rejected',()=>{
 assert.equal(consumptionUnits('0.001'),1);assert.equal(consumptionUnits('600.125'),600125);
 for(const raw of ['', ' ', '-1', '1,000', '1e3', '=1', '0.0001'])assert.equal(consumptionUnits(raw),null);
 assert.equal(run(change(rows(),0,{consumption_kwh:''})).status,'invalid');
});
test('units and currency require exact supported definitions with no silent conversions',()=>{
 for(const values of [{unit:'MWh'},{unit:'kW'},{unit:''},{currency:'EUR'},{currency:''}])assert.equal(run(change(rows(),1,values)).status,'invalid');
});
test('real dates and positive bounded periods required',()=>{
 for(const values of [{period_start:'2026-02-30'},{period_start:'07/01/2026'},{period_end:'2026-07-01'},{period_end:'2027-08-01'},{period_start:''}])assert.equal(run(change(rows(),1,values)).status,'invalid');
});
test('unequal length, different seasons, gaps and overlaps fail rather than normalize',()=>{
 for(const values of [{period_end:'2026-07-31'},{period_start:'2026-08-01',period_end:'2026-09-01'},{period_start:'2027-07-01',period_end:'2027-08-01'},{period_start:'2025-07-01',period_end:'2025-08-01'}]){const a=run(change(rows(),1,values));assert.equal(a.status,'invalid');assert.equal(a.findings.length,0);}
});
test('one bill and empty input are insufficient; partial second input is invalid',()=>{
 assert.equal(run(rows().slice(0,1)).status,'insufficient');assert.equal(run([]).status,'insufficient');assert.equal(run(change(rows(),1,{period_start:''})).status,'invalid');
});
test('exact component sums required and negative credits remain unsupported',()=>{
 for(const values of [{total_usd:'145.21'},{fixed_usd:'-1'},{variable_usd:'1e3'},{total_usd:''}])assert.equal(run(change(rows(),1,values)).status,'invalid');
});
test('reversed records and reordered headers retain every exact source coordinate',()=>{
 const cols=[...ELECTRICITY_FIELDS].reverse(),r=rows().reverse();const input=parseElectricityCsv(cols.join(',')+'\n'+r.map(row=>cols.map(c=>row[c]).join(',')).join('\n'));const a=analyzeElectricity(input.rows,input.columns);
 assert.equal(a.delta,2520);for(const f of a.findings)for(const c of f.cells){assert.equal(c.raw,input.rows[Number(c.cell.slice(1))-2][c.field]);assert.equal(c.cell[0],String.fromCharCode(65+cols.indexOf(c.field)));}assert.deepEqual(input.rows,r);
});
test('changed file shape, excess rows, duplicate or extra headers are rejected',()=>{
 for(const csv of [ELECTRICITY_CSV.replace('period_start','name'),ELECTRICITY_CSV+rows().map(row=>ELECTRICITY_FIELDS.map(f=>row[f]).join(',')).join('\n'),ELECTRICITY_CSV.replace('unit,currency','unit,unit')])assert.throws(()=>parseElectricityCsv(csv));
});
test('zero or decreasing bills never claim price causes or savings',()=>{
 const a=run(change(unknown(rows()),1,{total_usd:'0'}));assert.equal(a.delta,-12000);assert.match(a.findings[0].title,/fell/);assert.match(a.findings.find(f=>f.id==='unit-cost').title,/\$0.0000/);assert.ok(!a.findings.some(f=>/because|will save|price rose/.test(f.title)));
});
