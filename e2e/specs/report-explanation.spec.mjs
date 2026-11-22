import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, callable } from '../support/fixtures.mjs';

// Keep the existing preview untouched. Only this isolated demo run proxies the compiled local ports.
test.beforeEach(async({page})=>{
  if(process.env.QA_FUNCTIONS_EMULATOR_HOST!=='127.0.0.1:5008')return;
  for(const [oldPort,newPort] of [[9099,9989],[5001,5008],[8080,9988]])await page.route(`http://127.0.0.1:${oldPort}/**`,async route=>{
    const url=new URL(route.request().url());url.port=String(newPort);
    await route.fulfill({response:await route.fetch({url:url.toString()})});
  });
});

for(const [source,paid] of [['openai',true],['deterministic',true],['openai',false]])test(`${paid?'paid report':'free brief'} explanation requires consent and labels ${source} honestly`,async({page,fixtures})=>{
  const visitor=await fixtures(FIXTURES.FREE_WITH_DECISION,{decisions:1}),id=visitor.projectIds[0];
  const sample=(await callable('getSampleDecisionReport',{})).result;
  const {decisionReport: paidDetail,...freeBrief}=sample.brief;
  const shownBrief=paid?sample.brief:{...freeBrief,comparisons:freeBrief.comparisons.slice(0,1)};
  await page.route('**/getMarketIntelligenceProject',async route=>{
    const url=process.env.QA_FUNCTIONS_EMULATOR_HOST==='127.0.0.1:5008'?route.request().url().replace(':5001/',':5008/'):route.request().url();
    const result=(await (await route.fetch({url})).json()).result;
    await route.fulfill({json:{result:{...sample,...result,brief:shownBrief,location:sample.location,comparisonLocations:sample.comparisonLocations.slice(0,paid?3:1),id,sample:false,decisionReportPurchased:paid,decisionReportAccess:paid?'purchased':'none',decisionReportGenerationRequired:!paid,reportExplanationAvailable:true}}});
  });
  const requests=[];
  await page.route('**/explainDecisionReport',async route=>{
    requests.push(route.request().postDataJSON().data);
    await route.fulfill({json:{result:{source,takeaway:{id:'p0.income',place:'Place 1',statement:'Place 1: the saved household income estimate is $62,000.',sourceUrl:'https://api.census.gov/data/2024/acs/acs5',limitation:'This is not an individual salary.'},observations:[],limitation:'These estimates do not establish causation or personal costs.',nextStep:'Check current housing costs.'}}});
  });
  await signInThroughUi(page,visitor,'/login?returnUrl='+encodeURIComponent('/decisions/'+id));
  const section=page.getByRole('region',{name:'Understand the evidence'}),button=page.getByRole('button',{name:'Agree and explain my findings'});
  await expect(button).toBeVisible();expect(requests).toEqual([]);
  await expect(page.locator('#recommendation')).not.toContainText('A verified city comparison is unavailable.');
  await page.screenshot({path:`test-results/production-activation/before-consent-${paid}-${source}-${test.info().project.name}.png`,fullPage:true});
  await expect(section).toContainText('Your question, city names, identity, bills and documents are not sent.');
  await button.focus();await page.keyboard.press('Enter');
  await expect(section).toContainText(source==='openai'?'AI-selected evidence summary':'Local evidence summary');
  expect(requests).toEqual([{organizationId:visitor.organizationId,projectId:id,consent:'public-census-explanation-v1'}]);
  await expect(button).toHaveCount(0);await expect(section).toContainText('$62,000');
  await page.screenshot({path:`test-results/production-activation/after-consent-${paid}-${source}-${test.info().project.name}.png`,fullPage:true});
  for(const width of [320,390,820,1440]){await page.setViewportSize({width,height:844});await expectNoHorizontalScroll(page);}
  const axe=await new AxeBuilder({page}).include('[aria-labelledby="report-explanation-title"]').withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();expect(axe.violations.map(v=>v.id)).toEqual([]);
  await page.screenshot({path:`test-results/production-activation/mock-${source}-${paid}-${test.info().project.name}.png`,fullPage:false});
});

test('unavailable capability and public sample never show an AI purchase promise',async({page,fixtures})=>{
  const visitor=await fixtures(FIXTURES.FREE_WITH_DECISION,{decisions:1});
  await signInThroughUi(page,visitor,'/login?returnUrl='+encodeURIComponent('/decisions/'+visitor.projectIds[0]));
  await expect(page.getByRole('button',{name:'Agree and explain my findings'})).toHaveCount(0);
  await page.goto('/sample-report');await expect(page.getByRole('heading',{name:'Understand the evidence'})).toHaveCount(0);
});
