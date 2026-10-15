// ifYouMind Life browser engine (PR L1): calculation, verdict rules, redaction, and a check that
// every sentence it produces passes the decision engine's claim checker (functions/src/engine).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import ts from 'typescript';

const root=new URL('..',import.meta.url).pathname;
const engineDir=path.join(root,'src/app/life/engine');
const out=fs.mkdtempSync(path.join(os.tmpdir(),'life-engine-'));
const compile=(file,target)=>{
  const js=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ES2022,target:ts.ScriptTarget.ES2022}}).outputText
    .replace(/from '\.\/([\w-]+)'/g,"from './$1.mjs'");
  fs.writeFileSync(path.join(out,target),js);
};
for(const f of fs.readdirSync(engineDir).filter(f=>f.endsWith('.ts')))compile(path.join(engineDir,f),f.replace(/\.ts$/,'.mjs'));
compile(path.join(root,'functions/src/engine/evidence.ts'),'checker.mjs');
const L=await import(path.join(out,'index.mjs'));
const {EvidenceStore,checkClaims}=await import(path.join(out,'checker.mjs'));

// Illustrative inputs (price levels shaped like BEA RPP; not real figures).
const option=(label,salary,housing,minutes,priceLevel,extra={})=>({label,salary,housing,housingSource:'user',commuteMinutes:minutes,priceLevel,priceLevelSource:'metro',priceLevelSourceId:'bea-rpp-2024',...extra});
const input=(a,b,weights={money:3,time:3,career:3,people:2},taxShare=.23)=>({options:[a,b],taxShare,taxShareSource:'user',weights});
const grade=r=>checkClaims(r.claims,new EvidenceStore(r.evidence));

test('tax estimate: 2026 single filer, standard deduction, federal + FICA', () => {
  const t=L.estimateTax(80000);
  assert.equal(Math.round(t.federal),8770);           // 10% of 12,400 + 12% of 38,000 + 22% of 13,500
  assert.equal(Math.round(t.socialSecurity),4960);
  assert.equal(Math.round(t.medicare),1160);
  assert.ok(Math.abs(t.share-.1861)<.0005);
  assert.equal(L.estimateTax(0).total,0);
  assert.equal(L.estimateTax(16100).federal,0, 'income at the standard deduction owes no federal tax');
  const high=L.estimateTax(300000);
  assert.equal(Math.round(high.socialSecurity),Math.round(184500*.062), 'Social Security stops at the wage base');
  assert.equal(Math.round(high.medicare),Math.round(300000*.0145+100000*.009), 'Additional Medicare above $200,000');
  assert.equal(L.estimateTax(-5).total,0);
});

test('money: take-home, left after housing, buying power by price level', () => {
  const r=L.compareOptions(input(option('Raleigh, NC',80000,1550,20,97),option('Denver, CO',95000,2050,35,104)));
  const [a,b]=r.money;
  assert.ok(Math.abs(a.takeHome-80000*.77/12)<1e-9);
  assert.ok(Math.abs(a.left-(a.takeHome-1550))<1e-9);
  assert.ok(Math.abs(a.buyingPower-a.left/.97)<1e-9);
  assert.ok(Math.abs(b.buyingPower-b.left/1.04)<1e-9);
  assert.equal(r.comparison.leader,'B');
  assert.ok(Math.abs(r.comparison.relGap-(b.buyingPower-a.buyingPower)/a.buyingPower)<1e-9);
});

test('verdict: a leader only when it survives every one-step change to a priority', () => {
  const clear=L.compareOptions(input(option('A city',70000,1500,15,95,{career:2,people:2}),option('B city',120000,1600,15,100,{career:5,people:4}),{money:4,time:1,career:3,people:2}));
  assert.equal(clear.verdict.kind,'leader');
  assert.equal(clear.verdict.leader,'B');
  assert.match(clear.claims[0].text,/option B \(B city\) comes out ahead/);

  // Default prototype case: B leads, but one more step on "near family" ties it.
  const fragile=L.compareOptions(input(option('Raleigh, NC',80000,1550,20,97,{career:3,people:4}),option('Denver, CO',95000,2050,35,104,{career:4,people:2})));
  assert.equal(fragile.verdict.kind,'no_clear_winner');
  assert.ok(fragile.verdict.flipsOn.includes('people'));
  assert.match(fragile.claims[0].text,/^No clear winner on your priorities\. The result changes if .*being near family and friends/);
  for(const word of ['stronger','better','best','recommend'])assert.ok(!fragile.claims[0].text.toLowerCase().includes(word),word);
});

test('no priorities set, or ratings missing for one side: never a verdict from nothing', () => {
  const none=L.compareOptions(input(option('A',90000,1500,20,100),option('B',60000,1500,20,100),{money:0,time:0,career:0,people:0}));
  assert.equal(none.verdict.kind,'no_clear_winner');
  assert.match(none.claims[0].text,/set at least one priority/);
  const halfRated=L.compareOptions(input(option('A',90000,1500,20,100,{career:5}),option('B',60000,1500,20,100),{money:0,time:0,career:5,people:0}));
  assert.ok(!halfRated.verdict.used.includes('career'), 'a rating given for only one option is not used');
  assert.equal(halfRated.verdict.kind,'no_clear_winner');
});

test('small money gaps are flagged and worded as not clearly different, never ranked', () => {
  const r=L.compareOptions(input(option('A',80000,1500,20,100),option('B',81000,1500,20,100)));
  assert.equal(r.comparison.small,true);
  const money=r.claims.find(c=>c.id==='money');
  assert.match(money.text,/not clearly different/);
  assert.equal(money.assertion.relation,'similar');
  const big=L.compareOptions(input(option('A',60000,1500,20,100),option('B',100000,1500,20,100)));
  assert.equal(big.comparison.small,false);
  assert.match(big.claims.find(c=>c.id==='money').text,/^B leaves \$\d[\d,]* more a month/);
});

test('every sentence passes the evidence claim checker, across 500 seeded random comparisons', () => {
  let seed=42; const rnd=()=>(seed=(seed*1664525+1013904223)%4294967296)/4294967296;
  const pick=(lo,hi)=>Math.round(lo+rnd()*(hi-lo));
  let leaders=0,noWinner=0;
  for(let i=0;i<500;i++){
    const rate=()=>rnd()<.8?pick(1,5):undefined;
    const r=L.compareOptions({
      options:[option('A',pick(30000,250000),pick(700,4000),pick(0,90),pick(85,116),{career:rate(),people:rate(),commuteCost:pick(0,400)}),
               option('B',pick(30000,250000),pick(700,4000),pick(0,90),pick(85,116),{career:rate(),people:rate()})],
      taxShare:pick(5,40)/100,taxShareSource:rnd()<.5?'user':'estimate',
      weights:{money:pick(0,5),time:pick(0,5),career:pick(0,5),people:pick(0,5)},
    });
    for(const g of grade(r))assert.ok(g.ok,`case ${i} claim ${g.claim}: ${g.problems.join(', ')}`);
    r.verdict.kind==='leader'?leaders++:noWinner++;
  }
  assert.ok(leaders>50&&noWinner>50, `both outcomes exercised (${leaders} leaders, ${noWinner} no clear winner)`);
});

test('evidence carries provenance tags, and estimates stay distinct from the user\'s numbers', () => {
  const b={...option('B',95000,2000,35,104),housingSource:'estimate',priceLevelSource:'state_nonmetro'};
  const r=L.compareOptions({...input(option('A',80000,1500,20,97),b),taxShareSource:'estimate'});
  const byId=Object.fromEntries(r.evidence.map(e=>[e.id,e]));
  assert.equal(byId['A.priceLevel'].tag,'fact');
  assert.equal(byId['A.housing'].tag,'user');
  assert.equal(byId['B.housing'].tag,'estimate');
  assert.equal(byId['taxShare'].tag,'estimate');
  assert.equal(byId['A.money'].tag,'calculation');
  assert.equal(byId['B.priceLevel'].geography.level,'state');
  assert.match(r.nextSteps[0],/no metro price data/);
});

test('share text leaves amounts out unless the user turns them on', () => {
  const inp=input(option('Raleigh, NC',80000,1550,20,97),option('Denver, CO',95000,2050,35,104));
  const r=L.compareOptions(inp);
  const plain=L.shareText(inp,r.comparison,r.verdict);
  assert.ok(!plain.includes('$'), plain);
  assert.ok(!/80,?000|95,?000|1,?550|2,?050/.test(plain));
  const full=L.shareText(inp,r.comparison,r.verdict,true);
  assert.match(full,/\$80,000 vs \$95,000/);
});

test('deterministic, and the engine source has no network, storage or DOM access', () => {
  const inp=input(option('A',80000,1550,20,97,{career:3,people:4}),option('B',95000,2050,35,104,{career:4,people:2}));
  assert.deepEqual(L.compareOptions(inp),L.compareOptions(inp));
  for(const f of fs.readdirSync(engineDir)){
    const src=fs.readFileSync(path.join(engineDir,f),'utf8');
    assert.doesNotMatch(src,/\bfetch\(|XMLHttpRequest|localStorage|sessionStorage|indexedDB|document\.|window\.|navigator\.|@angular|firebase/, f);
  }
});
