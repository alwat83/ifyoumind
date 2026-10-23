// R2 conversion copy: source-level checks on the templates that sell the $79 Decision Report.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const root=new URL('..',import.meta.url);
const read=(file)=>fs.readFileSync(new URL(file,root),'utf8');

const reportHtml=read('src/app/intelligence/market-report.component.html');
const reportTs=read('src/app/intelligence/market-report.component.ts');
const reportScss=read('src/app/intelligence/market-report-offers.component.scss');
const analysisHtml=read('src/app/intelligence/market-analysis.component.html');
const landingHtml=read('src/app/intelligence/public-landing.component.html');
const pricingHtml=read('src/app/intelligence/pricing.component.html');
const registerHtml=read('src/app/auth/register/register.component.html');
const liveBrief=read('functions/src/intelligence/market-intelligence.ts');
const analysisText=read('functions/src/intelligence/market-analysis.ts');

const PILL='Included in the $79 report';

test('report eyebrow: sample is labelled as the report, unpaid stays a brief',()=>{
  assert.match(reportHtml,/<p class="eyebrow">\{\{ reportLabel \}\}<\/p>/);
  assert.doesNotMatch(reportHtml,/<p class="eyebrow">Decision Brief<\/p>/,'eyebrow is no longer hard-coded');
  const getter=reportTs.slice(reportTs.indexOf('get reportLabel()'),reportTs.indexOf('get reportPurchased()'));
  assert.ok(getter.length>0,'reportLabel getter exists');
  const sample=getter.indexOf("if(this.sampleMode)return 'Decision Report · Sample';");
  const paid=getter.indexOf("if(this.reportPurchased)return 'Decision Report';");
  const brief=getter.indexOf("return 'Decision Brief';");
  assert.ok(sample>=0&&paid>sample&&brief>paid,'sample first, then purchased, then the unpaid brief');
});

test('sample marks every paid-only section with the "Included in the $79 report" pill',()=>{
  for(const heading of ['Action plan','Comparison takeaways','What could change the call','Evidence boundaries']){
    assert.ok(
      reportHtml.includes(`<p class="eyebrow">${heading} <span *ngIf="sampleMode" class="paid-pill">${PILL}</span></p>`),
      `${heading} carries the pill in sample mode`,
    );
  }
  assert.match(reportHtml,/<app-market-analysis[^>]*\[includedInReport\]="sampleMode"/);
  assert.ok(analysisHtml.includes(`<span *ngIf="includedInReport" class="paid-pill">${PILL}</span>`));
  // #3730a3 on #eef2ff is about 9:1, well above WCAG AA 4.5:1.
  assert.match(reportScss,/\.paid-pill\{[^}]*background:#eef2ff;color:#3730a3/);
});

test('unpaid brief shows what the $79 report adds, with the existing pricing CTA',()=>{
  assert.match(reportHtml,/<section \*ngIf="!reportPurchased" class="report-offer report-adds[^"]*"/);
  assert.ok(reportHtml.includes('What the $79 report adds'));
  for(const item of ['up to three other cities','plan-ready market analysis','An action plan','Comparison takeaways','What could change the call','PDF']){
    assert.ok(reportHtml.includes(item),`lists: ${item}`);
  }
  assert.ok(reportHtml.includes(`[routerLink]="['/app/pricing']" [queryParams]="{offer:'report',projectId:project?.id}">Get the $79 report</a>`));
});

test('sample offers a direct $79 CTA and keeps Start free as the secondary action',()=>{
  const cta='Get this report for your cities · $79';
  assert.equal(reportHtml.split(cta).length-1,2,'in the top nav and in the end offer');
  assert.match(reportHtml,/<a routerLink="\/register" \[queryParams\]="\{intent:'report'\}" class="offer-primary">Get this report for your cities · \$79<\/a>\s*<a routerLink="\/register" class="offer-secondary">Start free<\/a>/);
});

test('metric cards hide the unit line when the value already shows it',()=>{
  assert.ok(reportHtml.includes('<small *ngIf="showUnit(metric.unit)">{{ metric.unit }}</small>'));
  assert.ok(reportTs.includes("return unit!=='USD'&&unit!=='%';"));
});

test('the $79 report comes before Pro on both pricing surfaces',()=>{
  const landingPricing=landingHtml.slice(landingHtml.indexOf('id="pricing"'));
  const order=(html,labels)=>labels.map(label=>html.indexOf(label));
  const [lFree,lReport,lPro]=order(landingPricing,['<span class="small-label">Free Decision Brief</span>','<span class="small-label">Decision Report</span>','<span class="small-label">Pro</span>']);
  assert.ok(lFree>=0&&lFree<lReport&&lReport<lPro,'homepage: Free, One report, Pro');
  const [pFree,pReport,pPro]=order(pricingHtml,['<span class="label">Free</span>','<span class="label">One report</span>','<span class="label">Pro</span>']);
  assert.ok(pFree>=0&&pFree<pReport&&pReport<pPro,'pricing page: Free, One report, Pro');
  assert.match(landingPricing,/<article class="featured"><span class="small-label">Decision Report<\/span>/,'homepage emphasises the $79 card');
  assert.match(pricingHtml,/<article class="featured"[^>]*>\s*<div class="topline"><span class="label">One report<\/span>/,'pricing page emphasises the $79 card');
  assert.ok(landingPricing.includes('For advisers and repeat comparisons.'));
  assert.ok(landingPricing.includes('Plan-ready market analysis with location rankings'));
  assert.ok(pricingHtml.includes('For advisers and anyone planning several locations a month.'));
  assert.ok(pricingHtml.includes('Recommended for one business plan'));
});

test('price amounts are unchanged',()=>{
  const landingPricing=landingHtml.slice(landingHtml.indexOf('id="pricing"'),landingHtml.indexOf('class="final"'));
  assert.ok(landingPricing.includes('<h3>$0</h3>'));
  assert.ok(landingPricing.includes('<h3>$79<span> / report</span></h3>'));
  assert.ok(landingPricing.includes('<h3>$39<span> / month</span></h3>'));
  assert.ok(pricingHtml.includes('<h2>$0</h2>'));
  assert.ok(pricingHtml.includes('<h2>${{ status.pricing.reportOneTimeUsd }}</h2>'));
  assert.ok(pricingHtml.includes('<h2>${{ status.pricing.proMonthlyUsd }}<small>/month</small></h2>'));
});

test('population-change wording names the real ACS periods and the margin of error',()=>{
  for(const source of [liveBrief,analysisText]){
    assert.doesNotMatch(source,/2019 and 2024 ACS/);
    assert.match(source,/between the 2015–2019 and 2020–2024 ACS 5-year estimates/);
  }
  assert.doesNotMatch(liveBrief,/stronger 5-year population change/);
  assert.ok(liveBrief.includes('higher estimated 5-year population change (differences may be within the margin of error).'));
});

test('consumer homepage preserves the Business entry point and plan-ready offer',()=>{
  assert.doesNotMatch(landingHtml,/Miami or Tampa/);
  assert.doesNotMatch(landingHtml,/<span>Your own data<\/span>/);
  assert.match(landingHtml,/id="business"/);
  assert.match(landingHtml,/Business · Available now/);
  assert.match(landingHtml,/Plan-ready market analysis/);
  assert.ok(landingHtml.indexOf('id="decide"')<landingHtml.indexOf('id="business"'),'consumer discovery leads; Business remains available');
});

test('support email is visible text, plus the privacy link, in the homepage footer',()=>{
  const footer=landingHtml.slice(landingHtml.indexOf('<footer'));
  assert.ok(footer.includes('<a href="mailto:support&#64;ifyoumind.com">support&#64;ifyoumind.com</a>'),'email is escaped for the Angular template compiler');
  assert.ok(footer.includes('routerLink="/privacy-policy"'));
});

test('register page says what happens next for email and Google sign-ups',()=>{
  assert.ok(registerHtml.includes('Next: verify your email, then two quick steps to your free brief.'));
  assert.ok(registerHtml.includes('Google sign-ups skip the email check.'));
});

test('no AI claims in the changed copy',()=>{
  for(const html of [reportHtml,landingHtml,pricingHtml,registerHtml,analysisHtml]){
    assert.doesNotMatch(html,/\bAI\b|artificial intelligence|GPT/i);
  }
});
