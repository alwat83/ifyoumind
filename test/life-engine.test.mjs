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
  assert.equal(byId['A.taxShare'].tag,'estimate');
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

// ---------------------------------------------------------------------------------------------
// Hand-verified examples. Every expected figure below was worked out by hand (shown in comments)
// and documented in docs/life/l1-financial-examples.md. Price levels are illustrative.
// ---------------------------------------------------------------------------------------------
const near=(a,b,eps=0.01)=>Math.abs(a-b)<=eps;
const ex=(a,b,extra={})=>({options:[a,b],taxShare:.20,taxShareSource:'user',stateTaxIncluded:true,weights:{money:3,time:0,career:0,people:0},...extra});
const opt=(label,salary,housing,extra={})=>({label,salary,housing,housingSource:'user',commuteMinutes:20,priceLevel:100,priceLevelKind:'non_housing',priceLevelSource:'metro',priceLevelYear:2024,...extra});
const texts=r=>r.claims.map(c=>c.text).join(' ')+' '+r.warnings.map(w=>w.text).join(' ');

test('E1 different salaries, same place: the whole difference is the after-tax raise', () => {
  // A: 60,000 × 0.80 / 12 = 4,000 take-home; − 1,500 housing = 2,500 left; ÷ 1.00 = 2,500
  // B: 75,000 × 0.80 / 12 = 5,000; − 1,500 = 3,500. Gap 1,000 = 40% of 2,500.
  const r=L.compareOptions(ex(opt('Same city',60000,1500),opt('Same city',75000,1500)));
  assert.ok(near(r.money[0].takeHome,4000)&&near(r.money[1].takeHome,5000));
  assert.ok(near(r.money[0].buyingPower,2500)&&near(r.money[1].buyingPower,3500));
  assert.ok(near(r.comparison.gap,1000)&&near(r.comparison.relGap,.40,1e-9));
  assert.match(r.claims.find(c=>c.id==='money').text,/leaves \$1,000 more a month .*\(40%\)/);
});

test('E2 different housing, same salary: housing is subtracted once, not also through the price level', () => {
  // 80,000 × 0.75 / 12 = 5,000 each. A 5,000 − 1,200 = 3,800; B 5,000 − 2,000 = 3,000.
  // Both price levels 100, so buying power = money left. Gap 800 = 26.7% of 3,000 → shown "27%".
  const r=L.compareOptions(ex(opt('A',80000,1200),opt('B',80000,2000),{taxShare:.25}));
  assert.ok(near(r.money[0].buyingPower,3800)&&near(r.money[1].buyingPower,3000));
  assert.equal(r.comparison.leader,'A');
  assert.match(r.claims.find(c=>c.id==='money').text,/^A leaves \$800 more a month .*\(27%\)/);
  // An all-items index (rent included) is flagged as a possible double count, not silently used.
  const allItems=L.compareOptions(ex(opt('A',80000,1200,{priceLevelKind:'all_items',priceLevel:110}),opt('B',80000,2000)));
  assert.ok(allItems.warnings.some(w=>w.code==='price_level_includes_rent'&&w.option==='A'));
});

test('E3 different state-tax situations: per-option tax shares, and unmodelled taxes are named', () => {
  // Federal estimate on 100,000 (single, 2026): taxable 83,900 → 1,240 + 4,560 + 22% × 33,500 (7,370) = 13,170;
  // Social Security 6,200; Medicare 1,450 → 20,820 = 20.82%.
  const est=L.estimateTax(100000);
  assert.ok(near(est.federal,13170)&&near(est.total,20820));
  // A (no state income tax, confirmed by the user): 20.82%. B: the user adds 5 points of state tax → 25.82%.
  // A: 100,000 × 0.7918 / 12 = 6,598.33 − 2,000 = 4,598.33. B: 100,000 × 0.7418 / 12 = 6,181.67 − 2,000 = 4,181.67.
  // Gap 416.67 = 9.96% of 4,181.67 → "10.0%".
  const r=L.compareOptions(ex(
    opt('No-income-tax state',100000,2000,{taxShare:.2082,taxShareSource:'estimate',stateTaxIncluded:true}),
    opt('State with income tax',100000,2000,{taxShare:.2582,taxShareSource:'user',stateTaxIncluded:true})));
  assert.ok(near(r.money[0].left,4598.33)&&near(r.money[1].left,4181.67));
  assert.match(r.claims.find(c=>c.id==='money').text,/\$417 more a month .*\(10\.0%\)/);
  assert.ok(!r.warnings.some(w=>w.code==='state_tax_not_included'));
  // Same pair, but B's state tax not entered: the page says state tax is not included for B.
  const missing=L.compareOptions(ex(opt('A',100000,2000,{taxShare:.2082,taxShareSource:'estimate',stateTaxIncluded:true}),opt('B',100000,2000,{taxShare:.2082,taxShareSource:'estimate'})));
  assert.ok(missing.warnings.some(w=>w.code==='state_tax_not_included'&&w.option==='B'));
  assert.match(missing.claims.find(c=>c.id==='limits').text,/estimated tax share \(federal income tax, Social Security and Medicare/);
});

test('E4 zero and negative money left: shortfalls are flagged and nothing divides by zero', () => {
  // 36,000 × 0.80 / 12 = 2,400. A housing 2,400 → 0 left. B housing 2,600 → −200 left.
  const r=L.compareOptions(ex(opt('A',36000,2400),opt('B',36000,2600)));
  assert.ok(near(r.money[0].left,0)&&near(r.money[1].left,-200));
  assert.deepEqual(r.warnings.filter(w=>w.code==='shortfall').map(w=>w.option),['A','B']);
  // Leader A by 200; the other option's −200 is the base, so 200 / |−200| = 100%.
  assert.equal(r.comparison.leader,'A'); assert.ok(near(r.comparison.relGap,1,1e-9));
  // Base exactly zero: no percentage is printed.
  const zero=L.compareOptions(ex(opt('A',36000,2400),opt('B',36000,2100)));
  assert.equal(zero.comparison.relGap,null);
  assert.match(zero.claims.find(c=>c.id==='money').text,/^B leaves \$300 more a month after housing and local prices, before/);
  assert.doesNotMatch(texts(zero)+texts(r),/NaN|Infinity/);
});

test('E5 missing or outdated reference data: never a silent default', () => {
  const r=L.compareOptions({...ex(opt('A',80000,1500,{priceLevel:NaN}),opt('B',80000,1500,{priceLevelYear:2020})),asOfYear:2026});
  assert.ok(r.warnings.some(w=>w.code==='price_level_missing'&&w.option==='A'));
  assert.ok(r.warnings.some(w=>w.code==='price_level_outdated'&&w.option==='B'));
  assert.equal(r.evidence.find(e=>e.id==='A.priceLevel').kind,'estimate', 'an assumed U.S. average is an estimate, not a fact');
  assert.equal(r.money[0].priceLevel,100);
  assert.match(r.nextSteps[0],/no metro price data/);
  const fallback=L.compareOptions(ex(opt('A',80000,1500,{priceLevelSource:'state_nonmetro',priceLevel:90}),opt('B',80000,1500)));
  assert.ok(fallback.warnings.some(w=>w.code==='price_level_fallback'));
});

test('E6 near-identical outcomes: a tiny money gap does not decide the verdict', () => {
  // 80,000 vs 81,000 × 0.80 / 12 = 5,333.33 vs 5,400 → left 3,833.33 vs 3,900 → gap 66.67 = 1.74%.
  const r=L.compareOptions(ex(opt('A',80000,1500),opt('B',81000,1500)));
  assert.ok(near(r.comparison.gap,66.67)&&r.comparison.small);
  assert.equal(r.verdict.kind,'no_clear_winner', 'money is the only priority and it is not clearly different');
  assert.ok(r.verdict.ignored.some(i=>i.criterion==='money'&&i.reason==='not_different'));
  assert.match(r.claims.find(c=>c.id==='verdict').text,/Money left each month is too close between the options to decide this/);
  // Commute within 5 minutes is treated the same way.
  const commute=L.compareOptions(ex(opt('A',80000,1500,{commuteMinutes:20}),opt('B',80000,1500,{commuteMinutes:23}),{weights:{money:0,time:5,career:0,people:0}}));
  assert.equal(commute.verdict.kind,'no_clear_winner');
});

test('E7 conflicting priorities: the verdict follows the weights and says when it is fragile', () => {
  // B pays more (money favours B); A has the shorter commute and family nearby.
  const a=opt('A',70000,1500,{commuteMinutes:15,people:5}), b=opt('B',110000,1500,{commuteMinutes:50,people:1});
  // Equal pull: money 4 (B) vs time 2 + people 2 (A) → scores 4 vs 4 → no clear winner.
  const tie=L.compareOptions(ex(a,b,{weights:{money:4,time:2,career:0,people:2}}));
  assert.equal(tie.verdict.kind,'no_clear_winner');
  // Money clearly first: 5 (B) vs 1 + 1 (A); every ±1 change keeps B ahead → B, with the scope stated.
  const money=L.compareOptions(ex(a,b,{weights:{money:5,time:1,career:0,people:1}}));
  assert.equal(money.verdict.leader,'B');
  const text=money.claims.find(c=>c.id==='verdict').text;
  assert.match(text,/On the priorities you set \(money left each month, commute time, being near family and friends\)/);
  assert.match(text,/Not included: career growth \(not rated for both options\)/);
  assert.match(text,/not a judgement of which option is better overall/);
});

test('E8 extreme but valid inputs stay finite and labelled', () => {
  // 1,000,000 salary: federal 320,000.25 (see docs), Social Security 11,439 (capped), Medicare 14,500 + 7,200.
  const t=L.estimateTax(1000000);
  assert.ok(near(t.federal,320000.25)&&near(t.socialSecurity,11439)&&near(t.medicare,21700));
  const r=L.compareOptions(ex(opt('A',1000000,0,{commuteMinutes:0,priceLevel:50}),opt('B',0,0,{commuteMinutes:180,priceLevel:200}),
    {weights:{money:5,time:5,career:5,people:5},taxShare:.6}));
  assert.doesNotMatch(texts(r),/NaN|Infinity|undefined/);
  assert.ok(r.warnings.some(w=>w.code==='shortfall'&&w.option==='B'), 'zero salary and zero housing leaves nothing');
  assert.equal(r.verdict.leader,'A');
  for(const g of grade(r))assert.ok(g.ok,g.problems.join(','));
});
