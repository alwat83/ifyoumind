// ifYouMind Life place data (PR L2): source checksums, reproducible build, schema, published-value
// spot checks, missing data and geographic fallbacks, and a run through the L1 engine.
import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import ts from 'typescript';

const root=new URL('..',import.meta.url).pathname;
const out=fs.mkdtempSync(path.join(os.tmpdir(),'life-data-'));
const compile=(file,target)=>{
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/from '\.\.\/engine\/([\w-]+)'/g,"from './$1.mjs'").replace(/from '\.\/([\w-]+)'/g,"from './$1.mjs'");
  fs.writeFileSync(path.join(out,target),js);
};
const engineDir=path.join(root,'src/app/life/engine');
for(const f of fs.readdirSync(engineDir).filter(f=>f.endsWith('.ts')))compile(path.join(engineDir,f),f.replace(/\.ts$/,'.mjs'));
compile(path.join(root,'src/app/life/data/places.ts'),'places.mjs');
compile(path.join(root,'functions/src/engine/evidence.ts'),'checker.mjs');
const P=await import(path.join(out,'places.mjs'));
const L=await import(path.join(out,'index.mjs'));
const {EvidenceStore,checkClaims}=await import(path.join(out,'checker.mjs'));

const dataPath=path.join(root,'data/life/build/life-places-v2024-1.json');
const D=JSON.parse(fs.readFileSync(dataPath,'utf8'));
const clone=()=>structuredClone(D);
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');

test('committed source files match their recorded SHA-256', () => {
  const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/life/raw/MANIFEST.json'),'utf8')).files;
  const committed=fs.readdirSync(path.join(root,'data/life/raw')).filter(f=>f!=='MANIFEST.json');
  assert.equal(committed.length,7);
  for(const name of committed){
    const rec=manifest.find(f=>f.filename===name);
    assert.ok(rec,`${name} is listed in MANIFEST.json`);
    assert.equal(sha(path.join(root,'data/life/raw',name)),rec.sha256,name);
  }
  for(const e of JSON.parse(fs.readFileSync(path.join(root,'data/life/extracts/EXTRACTS.json'),'utf8'))){
    assert.equal(sha(path.join(root,'data/life/extracts',e.extract)),e.extract_sha256,e.extract);
    assert.equal(e.source_sha256,manifest.find(f=>f.filename===e.source).sha256,`${e.extract} names the full file's hash`);
    const lines=fs.readFileSync(path.join(root,'data/life/extracts',e.extract),'utf8').trim().split('\n');
    assert.equal(lines.length-1,e.rows);
    assert.ok(lines.slice(1).every(l=>l.startsWith('310M700US')),'extracts hold only CBSA rows');
  }
});

test('the dataset is reproducible from the committed files', () => {
  const r=spawnSync('python3',['-I','scripts/life-data/build.py','--check'],{cwd:root,encoding:'utf8'});
  assert.equal(r.status,0,r.stderr||r.stdout);
});

test('schema validation passes, and catches broken data', () => {
  assert.deepEqual(P.validatePlaces(D),[]);
  const cases=[
    [d=>{d.schema='x';},/schema is x/],
    [d=>{delete d.areas['12420'].rent.br1;},/12420: rent.br1 missing/],
    [d=>{d.areas['12420'].price.nonHousing=250;},/12420: nonHousing is not a price level/],
    [d=>{d.areas['12420'].price.nonHousing=d.areas['12420'].price.goods-1;},/12420: nonHousing outside goods\.\.other/],
    [d=>{d.areas['12420'].price.geo='19740';},/12420: metro price from another area/],
    [d=>{d.areas['12420'].rent.br2={e:-666666666,m:null};},/12420: rent.br2 invalid/],
    [d=>{d.method.nonHousing.weights.goods=.5;},/weights must be positive and sum to 1/],
    [d=>{d.places.push(['Nowhere','TX','99999']);},/unknown area/],
    [d=>{d.sources['bea-rpp-2024'].files[0].sha256='abc';},/source bea-rpp-2024/],
  ];
  for(const [mutate,expected] of cases){
    const d=clone(); mutate(d);
    assert.match(P.validatePlaces(d).join('\n'),expected);
  }
});

test('published values: BEA 2024 RPPs and ACS 2020-2024 rents', () => {
  // BEA MARPP, released February 19, 2026, 2024 column.
  assert.equal(D.areas['41860'].price.all,115.613);   // San Francisco-Oakland-Fremont, CA
  assert.equal(D.areas['43340'].price.all,84.766);    // Shreveport-Bossier City, LA
  assert.equal(D.national.usNonmetro.all,88.699);     // United States (Nonmetropolitan Portion)
  assert.equal(D.national.us.all,100);
  assert.deepEqual(D.areas['41860'].price,{source:'metro',geo:'41860',all:115.613,goods:108.465,housing:194.718,utilities:172.585,other:106.207,nonHousing:107.059});
  // ACS B25031 / B25064, CBSA, 2020-2024 5-year, released January 29, 2026.
  assert.deepEqual(D.areas['12420'].rent,{all:{e:1726,m:11},br1:{e:1500,m:20},br2:{e:1795,m:14}}); // Austin
  assert.deepEqual(D.areas['39580'].rent.br1,{e:1400,m:19});                                         // Raleigh
  assert.deepEqual(D.areas['19740'].rent.br2,{e:1961,m:14});                                         // Denver
  assert.equal(D.areas['12420'].name,'Austin-Round Rock-San Marcos, TX');                           // OMB 2023 title
});

test('coverage: every BEA metro has its own price level and all three rents', () => {
  const metros=Object.entries(D.areas).filter(([,a])=>a.price?.source==='metro');
  assert.equal(metros.length,387);
  for(const [code,a] of metros){
    assert.equal(a.type,'metro',code);
    for(const k of ['all','br1','br2'])assert.ok(a.rent[k]&&a.rent[k].m!==null,`${code} rent.${k}`);
  }
  assert.equal(Object.keys(D.areas).length,935);
  assert.equal(Object.values(D.areas).filter(a=>a.type==='metro').length,393, '387 BEA metros + 6 in Puerto Rico');
});

test('non-housing composite: published components only, bounded, and reproducible', () => {
  const {goods:wg,other:wo}=D.method.nonHousing.weights;
  assert.equal(wg+wo,1);
  assert.ok(D.method.nonHousing.fit.rmse<1,'the fitted weights reproduce all items closely');
  for(const a of Object.values(D.areas).filter(a=>a.price)){
    const p=a.price;
    assert.ok(Math.abs(p.nonHousing-Math.exp(wg*Math.log(p.goods)+wo*Math.log(p.other)))<.0006);
    assert.ok(p.nonHousing>=Math.min(p.goods,p.other)-.001&&p.nonHousing<=Math.max(p.goods,p.other)+.001);
  }
  // It removes most of the rent gap: San Francisco all items 115.6, non-housing 107.1 (housing 194.7).
  assert.ok(D.areas['41860'].price.nonHousing<D.areas['41860'].price.all-8);
});

test('fallback: micropolitan areas use the state nonmetropolitan portion', () => {
  const aberdeen=D.areas['10100'];                       // Aberdeen, SD (micropolitan)
  assert.equal(aberdeen.type,'micro');
  assert.equal(aberdeen.price.source,'state_nonmetro');
  assert.equal(aberdeen.price.geo,'46999');
  assert.equal(aberdeen.price.all,D.stateNonmetro['46'].all);
  assert.equal(aberdeen.price.all,86.681);               // BEA PARPP, South Dakota (Nonmetropolitan Portion), 2024
  const micros=Object.values(D.areas).filter(a=>a.type==='micro');
  assert.ok(micros.every(a=>a.price===null||a.price.source==='state_nonmetro'));
  assert.equal(P.priceInput(D,'10100').priceLevelSource,'state_nonmetro');
  const r=L.compareOptions({options:[
    {label:'Aberdeen, SD',salary:60000,housing:900,housingSource:'user',commuteMinutes:15,...P.priceInput(D,'10100')},
    {label:'Austin, TX',salary:70000,housing:1600,housingSource:'user',commuteMinutes:25,...P.priceInput(D,'12420')}],
    taxShare:.2,taxShareSource:'user',asOfYear:2026,weights:{money:3,time:2,career:0,people:0}});
  assert.deepEqual(r.warnings.map(w=>[w.code,w.option]),[['price_level_fallback','A'],['state_tax_not_included','A'],['state_tax_not_included','B']]);
});

test('missing data: no invented price levels or rents', () => {
  const missing=Object.entries(D.areas).filter(([,a])=>a.price===null).map(([c])=>c);
  assert.equal(missing.length,11);
  assert.deepEqual(D.gaps.map(g=>g[0]),missing);
  assert.ok(missing.every(c=>['PR','DE'].includes(D.areas[c].primaryState)));
  // Delaware: BEA prints 0.000 for its nonmetropolitan portion, which is read as missing, not as a level.
  assert.equal(D.stateNonmetro['10'],undefined);
  assert.equal(D.areas['42580'].price,null);             // Seaford, DE (micropolitan)
  // Puerto Rico is outside the BEA price parities.
  const sanJuan=P.priceInput(D,'41980');
  assert.ok(Number.isNaN(sanJuan.priceLevel));
  assert.equal(sanJuan.priceLevelSource,'national_default');
  const r=L.compareOptions({options:[
    {label:'San Juan, PR',salary:50000,housing:700,housingSource:'user',commuteMinutes:20,...sanJuan},
    {label:'Austin, TX',salary:70000,housing:1600,housingSource:'user',commuteMinutes:25,...P.priceInput(D,'12420')}],
    taxShare:.2,taxShareSource:'user',stateTaxIncluded:true,weights:{money:3,time:0,career:0,people:0}});
  assert.ok(r.warnings.some(w=>w.code==='price_level_missing'&&w.option==='A'),'the engine says the U.S. average was assumed');
  assert.deepEqual(checkClaims(r.claims,new EvidenceStore(r.evidence)).filter(c=>!c.ok),[]);
  // ACS rent with no estimate stays null; the 1-bedroom request falls back to all units and says so.
  assert.equal(D.areas['26700'].rent.br1,null);          // Huron, SD
  assert.deepEqual(P.rentEstimate(D,'26700',1),{monthly:879,moe:51,basis:'all',sourceId:'acs5-2024-b25064'});
  assert.deepEqual(P.rentEstimate(D,'12420',2),{monthly:1795,moe:14,basis:'br2',sourceId:'acs5-2024-b25031'});
  assert.equal(P.rentEstimate(D,'00000',1),null);
});

test('place search: principal cities, state disambiguation, accents', () => {
  assert.deepEqual(P.findPlaces(D,'Austin').map(p=>[p.label,p.code]),[['Austin, TX','12420'],['Austin, MN','12380']], 'metro first');
  assert.deepEqual(P.findPlaces(D,'portland').map(p=>p.label),['Portland, ME','Portland, OR']);
  assert.deepEqual(P.findPlaces(D,'Portland, OR').map(p=>p.code),['38900']);
  assert.equal(P.findPlaces(D,'springfield mo')[0].code,'44180');
  assert.ok(P.findPlaces(D,'Bayamon').some(p=>p.code==='41980'),'accents are ignored (Bayamón)');
  assert.deepEqual(P.findPlaces(D,'  '),[]);
  assert.deepEqual(P.findPlaces(D,'zzzz'),[]);
});

test('end to end: official data into the L1 engine, every sentence passes the claim checker', () => {
  const austin=P.rentEstimate(D,'12420',1), denver=P.rentEstimate(D,'19740',1);
  const r=L.compareOptions({options:[
    {label:'Austin, TX',salary:85000,housing:austin.monthly,housingSource:'estimate',commuteMinutes:25,...P.priceInput(D,'12420')},
    {label:'Denver, CO',salary:92000,housing:denver.monthly,housingSource:'estimate',commuteMinutes:30,...P.priceInput(D,'19740')}],
    taxShare:.22,taxShareSource:'estimate',stateTaxIncluded:true,asOfYear:2026,weights:{money:4,time:2,career:0,people:0}});
  assert.deepEqual(r.warnings,[]);
  assert.equal(r.money[0].priceLevel,95.289);
  assert.equal(r.money[1].priceLevel,100.019);
  assert.deepEqual(checkClaims(r.claims,new EvidenceStore(r.evidence)).filter(c=>!c.ok),[]);
});
