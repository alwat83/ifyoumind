import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const compiled=ts.transpileModule(fs.readFileSync('src/app/intelligence/report-proof.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText;
const {buildReportProof,proofNumber}=await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const metric=(key,value,unit=key==='income'?'USD':'%')=>({key,value,unit,sourceUrl:'https://api.census.gov/data/2024/acs/acs5?for=place:1'});
const place=(location,income,growth)=>({location,metrics:[metric('income',income),metric('growth',growth)]});
const brief=()=>({metrics:place('A',93658,3).metrics,comparisons:[place('B',77371,4),place('C',82068,5.4)],sources:[2019,2024].map(year=>({dataset:`${year} ACS 5-year estimates`,url:`https://api.census.gov/data/${year}/acs/acs5`,retrievedAt:'2026-10-11T12:00:00Z'}))});

test('proof derives a measure-specific trade-off and exact values without an overall recommendation',()=>{
 const data=brief(),original=JSON.stringify(data),p=buildReportProof('A',data);
 assert.equal(p.crossed,true);assert.equal(p.lenses[0].highest,93658);assert.equal(p.lenses[0].places,'A');assert.equal(p.lenses[1].highest,5.4);assert.equal(p.lenses[1].places,'C');
 assert.equal(p.lenses[0].period,'2020–2024 ACS estimates');assert.equal(p.lenses[1].period,'2015–2019 to 2020–2024 ACS estimates');assert.equal(p.sources[0].retrievedAt,'2026-10-11T12:00:00.000Z');
 assert.equal(proofNumber(93658,'income'),'$93,658');assert.equal(proofNumber(-2.5,'growth'),'-2.5%');assert.equal(JSON.stringify(data),original);assert.equal(p.winner,undefined);
});
test('ties and equal estimates list every tied city without picking a winner',()=>{
 const data=brief();data.comparisons[0].metrics[0].value=93658;let p=buildReportProof('A',data);
 assert.equal(p.crossed,false);assert.equal(p.lenses[0].places,'A / B');assert.equal(p.lenses[0].highlightLabel,'Joint highest estimate');
 data.comparisons[1].metrics[0].value=93658;p=buildReportProof('A',data);assert.equal(p.lenses[0].places,'A / B / C');assert.equal(p.lenses[0].highlightLabel,'Same estimate in all cities');
});
test('missing, wrong-unit and non-finite data remain unavailable, never zero or a selected highest',()=>{
 for(const bad of [undefined,null,NaN,Infinity,-1]){
  const data=brief();data.comparisons[0].metrics[0].value=bad;const lens=buildReportProof('A',data).lenses[0];assert.equal(lens.rows[1].value,null);assert.equal(lens.complete,false);assert.equal(lens.highest,null);
 }
 const data=brief();data.comparisons[0].metrics[0].unit='EUR';assert.equal(buildReportProof('A',data).lenses[0].highest,null);
});
test('zero and decreasing population figures keep direction and a bounded shared scale',()=>{
 const data=brief();data.metrics[1].value=0;data.comparisons[0].metrics[1].value=-2;data.comparisons[1].metrics[1].value=-4;
 const proof=buildReportProof('A',data);assert.equal(proof.crossed,false);const lens=proof.lenses[1];assert.equal(lens.highest,0);assert.equal(lens.rows[2].value,-4);assert.equal(lens.zero,100);
 for(const row of lens.rows){assert.ok(row.left>=0&&row.width>=0&&row.left+row.width<=100.000001);assert.ok(Number.isFinite(row.width));}
 data.metrics[1].value=1e308;data.comparisons[0].metrics[1].value=-1e308;for(const row of buildReportProof('A',data).lenses[1].rows)assert.ok(Number.isFinite(row.width));
});
test('a saved report without provenance does not invent periods or retrieval dates',()=>{
 const data=brief();data.sources=[];data.metrics[0].sourceUrl=undefined;let p=buildReportProof('A',data);assert.match(p.lenses[0].period,/not recorded/);assert.match(p.lenses[1].period,/not recorded/);assert.equal(p.sources.length,0);
 data.sources=[{dataset:'Bad',url:'javascript:alert(1)',retrievedAt:'today'},{dataset:'Not Census',url:'https://api.census.gov.evil.test/data/2024/acs/acs5',retrievedAt:'2026-10-11'}];assert.equal(buildReportProof('A',data).sources.length,0);
 data.sources=[{dataset:'2024 ACS',url:'https://api.census.gov/data/2024/acs/acs5',retrievedAt:'unavailable'}];p=buildReportProof('A',data);assert.equal(p.sources[0].retrievedAt,null);
});
test('known incompatible income vintages are not presented as a comparable lens',()=>{
 const data=brief();data.comparisons[0].metrics[0].sourceUrl='https://api.census.gov/data/2019/acs/acs5';const p=buildReportProof('A',data);assert.deepEqual(p.lenses.map(l=>l.key),['growth']);assert.equal(p.crossed,false);
});
test('unsupported older shapes fall back; a missing lens never substitutes another measure',()=>{
 assert.equal(buildReportProof('A',undefined),null);assert.equal(buildReportProof('A',{metrics:[],comparisons:[]}),null);
 const data=brief();data.comparisons[0].location='A';assert.equal(buildReportProof('A',data),null);
 const missing=brief();for(const place of [missing,...missing.comparisons])place.metrics=place.metrics.filter(m=>m.key==='income');const p=buildReportProof('A',missing);assert.equal(p.lenses.length,1);assert.equal(p.lenses[0].key,'income');assert.equal(p.crossed,false);
});
