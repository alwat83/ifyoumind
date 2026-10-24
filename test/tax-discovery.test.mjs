import test from 'node:test';
import assert from 'node:assert/strict';
import {loadDiscovery} from './helpers/load-discovery.mjs';
const {analyzeTax,parseTaxCsv,moneyCents,EXAMPLE_CSV,percentChange,TAX_FIELDS}=await loadDiscovery('tax-discovery');
const example=()=>parseTaxCsv(EXAMPLE_CSV).rows;
const change=(rows,row,fields)=>rows.map((r,i)=>i===row?{...r,...fields}:r);
const run=rows=>analyzeTax(rows);

test('synthetic example automatically yields exact totals, component contribution and common change',()=>{
 const r=run(example());assert.equal(r.status,'ready');assert.equal(r.delta,42000);assert.equal(r.percent,'10%');assert.equal(r.findings.length,3);
 assert.match(r.findings[1].detail,/57.1%/);assert.deepEqual(r.changes.map(c=>c.delta),[9000,24000,9000]);assert.match(r.findings[2].title,/10%/);
});
test('every finding cites actual raw cells and a reproducible calculation',()=>{
 const rows=example(),r=run(rows);
 for(const f of r.findings){assert.ok(f.steps.length);assert.ok(f.cells.length);for(const c of f.cells){const row=Number(c.cell.slice(1))-2;assert.equal(c.raw,rows[row][c.field]);assert.equal(c.cell[0],String.fromCharCode(65+TAX_FIELDS.indexOf(c.field)));}}
 assert.deepEqual(r.findings[0].cells.map(c=>c.cell),['A2','E2','A3','E3']);
});
test('missing amount is invalid rather than silently zero',()=>{
 const r=run(change(example(),0,{county_usd:''}));assert.equal(r.status,'invalid');assert.match(r.issues[0].message,/missing/);assert.equal(r.findings.length,0);
 assert.equal(moneyCents(''),null);assert.equal(moneyCents('  '),null);
});
test('zero baseline is valid, dollar change remains useful and percent unavailable',()=>{
 const r=run(change(example(),0,{county_usd:'0',school_usd:'0',municipal_usd:'0',total_usd:'0'}));assert.equal(r.status,'ready');assert.equal(r.percent,null);assert.equal(r.delta,462000);assert.match(r.findings[0].steps[1],/zero/);assert.equal(r.findings.length,2);
});
test('all-zero data is a valid no-change result',()=>{
 const rows=example().map(r=>({...r,county_usd:'0',school_usd:'0',municipal_usd:'0',total_usd:'0'}));const r=run(rows);assert.equal(r.status,'ready');assert.equal(r.delta,0);assert.equal(r.percent,null);assert.match(r.findings[1].title,/same/);
});
test('unchanged positive data does not fabricate a pattern or contributor',()=>{
 const rows=example();rows[1]={...rows[0],tax_year:'2025'};const r=run(rows);assert.equal(r.percent,'0%');assert.equal(r.findings.length,2);assert.match(r.findings[0].title,/same/);
});
test('decrease is signed and contribution remains an arithmetic share',()=>{
 const rows=example();[rows[0].tax_year,rows[1].tax_year]=['2025','2024'];const r=run(rows);assert.equal(r.delta,-42000);assert.equal(r.percent,'−9.1%');assert.match(r.findings[0].title,/fell/);assert.match(r.findings[1].detail,/57.1%/);
});
test('offsetting changes with zero net omit misleading percentages',()=>{
 const r=run(change(example(),1,{county_usd:'1000',school_usd:'2300',municipal_usd:'900',total_usd:'4200'}));assert.equal(r.status,'ready');assert.equal(r.delta,0);assert.match(r.findings[1].title,/charges shifted/);assert.match(r.findings[1].detail,/offset/);assert.doesNotMatch(r.findings[1].detail,/\d+%/);
});
test('mixed-direction changes with nonzero net do not show contribution shares',()=>{
 const r=run(change(example(),1,{county_usd:'1100',school_usd:'2300',municipal_usd:'900',total_usd:'4300'}));assert.equal(r.status,'ready');assert.match(r.findings[1].detail,/offset/);assert.equal(r.findings.length,2);
});
test('tied largest contributors are identified honestly',()=>{
 const r=run(change(example(),1,{county_usd:'1000',school_usd:'2500',municipal_usd:'900',total_usd:'4400'}));assert.match(r.findings[1].title,/tie/);assert.match(r.findings[1].detail,/tied/);
});
test('component sums must reconcile exactly to the cent',()=>{
 const r=run(change(example(),1,{total_usd:'4620.01'}));assert.equal(r.status,'invalid');assert.match(r.issues[0].message,/add up/);assert.equal(r.findings.length,0);
});
test('one valid statement is insufficient and never produces comparison findings',()=>{
 const r=run(example().slice(0,1));assert.equal(r.status,'insufficient');assert.equal(r.findings.length,0);assert.match(r.issues[0].message,/One statement/);
});
test('empty input is insufficient; a partially entered second row is invalid',()=>{
 assert.equal(run([]).status,'insufficient');assert.equal(run([...example().slice(0,1),{tax_year:'2025',county_usd:'',school_usd:'',municipal_usd:'',total_usd:''}]).status,'invalid');
});
test('duplicate years, including duplicate statements, are refused',()=>{
 assert.equal(run(change(example(),1,{tax_year:'2024'})).status,'invalid');assert.match(run([example()[0],example()[0]]).issues[0].message,/same tax year/);
});
test('nonconsecutive or malformed years are refused rather than annualized',()=>{
 assert.equal(run(change(example(),1,{tax_year:'2026'})).status,'invalid');for(const year of ['24','2024.0','2024e0','1899','2200','=2024'])assert.equal(run(change(example(),0,{tax_year:year})).status,'invalid');
});
test('invalid/negative/ambiguous/formula amounts are not coerced',()=>{
 for(const value of ['-1','1e3','1,000','1.234','NaN','Infinity','$1','(1)','1%','=100+2','01','9999999999','1\n2'])assert.equal(moneyCents(value),null,value);
 assert.equal(moneyCents('0'),0);assert.equal(moneyCents('0.01'),1);assert.equal(moneyCents('1.2'),120);assert.equal(moneyCents(' 12.34 '),1234);
});
test('exact-cent arithmetic and percentage rounding do not use binary float intermediates',()=>{
 const rows=[{tax_year:'2024',county_usd:'0.10',school_usd:'0.20',municipal_usd:'0',total_usd:'0.30'},{tax_year:'2025',county_usd:'0.15',school_usd:'0.30',municipal_usd:'0',total_usd:'0.45'}];assert.equal(run(rows).delta,15);assert.equal(run(rows).percent,'50%');assert.equal(percentChange(1,16),'6.3%');assert.equal(percentChange(-1,16),'−6.3%');
});
test('reversed row order and reordered headers preserve original evidence coordinates',()=>{
 const input=parseTaxCsv('total_usd,tax_year,school_usd,county_usd,municipal_usd\n4620.00,2025,2640.00,990.00,990.00\n4200.00,2024,2400.00,900.00,900.00\n');const r=analyzeTax(input.rows,input.columns);assert.equal(r.delta,42000);assert.deepEqual(r.findings[0].cells.map(c=>c.cell),['B3','A3','B2','A2']);
});
test('supported CSV accepts BOM/CRLF/quoted decimal cells; no unknown columns',()=>{
 assert.equal(parseTaxCsv('\uFEFF'+EXAMPLE_CSV.replaceAll('\n','\r\n')).rows.length,2);assert.equal(parseTaxCsv(EXAMPLE_CSV.replace('900.00','"900.00"')).rows[0].county_usd,'900.00');assert.throws(()=>parseTaxCsv(EXAMPLE_CSV.replace('tax_year','owner_name')),/supported/);
});
test('extra/missing/duplicate headers and malformed or oversized files fail closed',()=>{
 for(const csv of ['year,total\n2024,1','tax_year,county_usd,school_usd,municipal_usd,total_usd,owner\n2024,1,1,1,3,x',EXAMPLE_CSV.replace('school_usd','county_usd'),EXAMPLE_CSV+'2026,1,1,1,3\n','tax_year,county_usd,school_usd,municipal_usd,total_usd\n','x'.repeat(2_000_001),EXAMPLE_CSV+'\0'])assert.throws(()=>parseTaxCsv(csv));
});
test('different percentage changes are not labeled as a common pattern',()=>{
 const r=run(change(example(),1,{county_usd:'1000',school_usd:'2640',municipal_usd:'990',total_usd:'4630'}));assert.equal(r.status,'ready');assert.equal(r.findings.length,2);
});
test('high supported amounts remain exact and source input is not mutated',()=>{
 const rows=example(),copy=JSON.stringify(rows);run(rows);assert.equal(JSON.stringify(rows),copy);assert.equal(moneyCents('999999999.99'),99999999999);assert.equal(run(change(rows,0,{total_usd:'-1'})).findings.length,0);
});
test('a small real change is never presented as zero percent',()=>{
 assert.notEqual(percentChange(1,99999999999),'0%');assert.equal(percentChange(1,1000000),'0.0001%');assert.equal(percentChange(-1,1000000),'−0.0001%');
});
test('invalid embedded quotes or multiline numeric fields are not silently normalized',()=>{
 assert.throws(()=>parseTaxCsv(EXAMPLE_CSV.replace('900.00','9"00".00')),/quotation/);assert.throws(()=>parseTaxCsv(EXAMPLE_CSV.replace('900.00','"900".00')),/quotation/);assert.throws(()=>parseTaxCsv(EXAMPLE_CSV.replace('900.00','"900\n.00"')),/Multiline/);
});
