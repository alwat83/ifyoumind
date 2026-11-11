import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { seedSampleReport, callable, FIXTURES } from '../support/fixtures.mjs';
test.beforeAll(seedSampleReport);

test('sample proof switches real measures and opens both source vintages without another request',async({page})=>{
 let reads=0;page.on('request',r=>{if(r.url().endsWith('/getSampleDecisionReport')&&r.method()==='POST')reads++;});
 await page.goto('/sample-report');const proof=page.locator('app-report-proof');
 await expect(proof.locator('.proof-highlight').first()).toContainText('$93,658');await expect(proof.locator('.proof-highlight').nth(1)).toContainText('Charlotte, NC');
 await expect(proof).toContainText('do not establish business demand');await expect(proof).toContainText('not been tested for statistical significance');
 await proof.getByRole('button',{name:'Population change',exact:true}).focus();await page.keyboard.press('Enter');
 await expect(proof.locator('#proof-growth')).toBeVisible();await expect(proof.locator('#proof-income')).toBeHidden();await expect(proof.locator('#proof-growth')).toContainText('5.4%');
 await proof.locator('summary').focus();await page.keyboard.press('Enter');await expect(proof.locator('.proof-sources a').filter({hasText:'2019 ACS'})).toHaveAttribute('href',/\/data\/2019\/acs\/acs5/);await expect(proof.locator('.proof-sources a').filter({hasText:'2024 ACS'})).toHaveAttribute('href',/\/data\/2024\/acs\/acs5/);expect(reads).toBe(1);
 await proof.getByRole('link',{name:'Read the market-analysis draft'}).click();await expect(page.locator('#market-analysis')).toBeFocused();
 await expect(page.locator('#market-analysis').getByRole('button',{name:'Copy as text'})).toBeVisible();
 await proof.getByRole('link',{name:'See the research checklist'}).click();await expect(page.locator('#action-plan')).toBeFocused();await expectNoHorizontalScroll(page);
});

test('proof withholds a sole highest estimate for ties and unavailable values',async({page})=>{
 const sample=(await callable('getSampleDecisionReport',{})).result;
 sample.brief.comparisons[0].metrics.find(m=>m.key==='income').value=sample.brief.metrics.find(m=>m.key==='income').value;
 sample.brief.comparisons[1].metrics=sample.brief.comparisons[1].metrics.filter(m=>m.key!=='growth');
 await page.route('**/getSampleDecisionReport',r=>r.fulfill({json:{result:sample}}));await page.goto('/sample-report');const proof=page.locator('app-report-proof');
 await expect(proof.locator('.proof-highlight').first()).toContainText('Austin, TX / Nashville, TN');await expect(proof).toContainText('Joint highest estimate');await expect(proof.locator('.proof-highlight').nth(1)).toContainText('Incomplete');
 await proof.getByRole('button',{name:'Population change',exact:true}).click();await expect(proof.locator('#proof-growth')).toContainText('Unavailable');await expect(proof.locator('#proof-growth')).toContainText('cannot identify the highest estimate');
});

test('unsupported saved sample falls back to the complete existing report',async({page})=>{
 const sample=(await callable('getSampleDecisionReport',{})).result;
 for(const place of[sample.brief,...sample.brief.comparisons])place.metrics=place.metrics.filter(m=>!['income','growth'].includes(m.key));
 await page.route('**/getSampleDecisionReport',r=>r.fulfill({json:{result:sample}}));await page.goto('/sample-report');
 await expect(page.locator('app-report-proof')).toHaveCount(0);await expect(page.locator('h1')).toHaveText(sample.decision);await expect(page.locator('#market-analysis')).toBeVisible();await expect(page.locator('#sources a')).toHaveCount(2);
});

test('proof stays readable with narrow screens, text spacing, reduced motion and forced colors',async({page})=>{
 await page.setViewportSize({width:320,height:568});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/sample-report');await expect(page.locator('.proof')).toBeVisible();
 await page.addStyleTag({content:'*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}'});
 await expectNoHorizontalScroll(page);const results=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();expect(results.violations.map(v=>v.id)).toEqual([]);
 await page.emulateMedia({forcedColors:'active'});const selected=page.getByRole('button',{name:'Household income',exact:true});await expect(selected).toHaveAttribute('aria-pressed','true');await selected.focus();await expect(selected).toBeFocused();await expectNoHorizontalScroll(page);
});

test('print canvas is immediately white and exports both measures and source limits',async({page})=>{
 await page.goto('/sample-report');await expect(page.locator('.proof')).toBeVisible();await page.getByRole('button',{name:'Population change',exact:true}).click();await page.emulateMedia({media:'print'});
 expect(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor)).toBe('rgb(255, 255, 255)');
 await expect(page.locator('#proof-income')).toBeVisible();await expect(page.locator('#proof-growth')).toBeVisible();await expect(page.locator('.print-sources')).toContainText('2019 ACS');await expect(page.locator('.print-sources')).toContainText('2024 ACS');await expect(page.locator('.proof-controls')).toBeHidden();await expect(page.locator('.proof-boundary')).toBeVisible();await expect(page.locator('#market-analysis')).toBeVisible();
 await page.emulateMedia({media:'screen'});await page.goto('/');expect(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor)).not.toBe('rgb(255, 255, 255)');
});

test('owned free, purchased and Pro rendering keep their entitlement boundary without the sample digest',async({page,fixtures},testInfo)=>{
 const user=await fixtures(FIXTURES.FREE_WITH_DECISION,{decisions:1}),sample=(await callable('getSampleDecisionReport',{})).result;
 let access='none';await page.route('**/getMarketIntelligenceProject',r=>{const brief={...sample.brief};if(access==='none'){delete brief.decisionReport;brief.comparisons=brief.comparisons.slice(0,1);}return r.fulfill({json:{result:{...sample,id:user.projectIds[0],sample:false,brief,decisionReportPurchased:access==='purchased',decisionReportAccess:access}}});});
 await signInThroughUi(page,user,`/login?returnUrl=${encodeURIComponent('/app/result/'+user.projectIds[0])}`);
 await expect(page.locator('.report')).toBeVisible();await expect(page.locator('app-report-proof')).toHaveCount(0);await expect(page.locator('#market-analysis')).toHaveCount(0);await expect(page.locator('.comparison-grid article')).toHaveCount(2);await expect(page.getByRole('link',{name:'Full report · $79',exact:true})).toBeVisible();
 async function exportState(state){
  if(testInfo.project.name!=='desktop')return;
  await page.addStyleTag({content:'@media print{.firebase-emulator-warning{display:none!important}}'});
  for(const format of['Letter','A4'])for(const backgrounds of[true,false])await page.pdf({path:testInfo.outputPath(`${state}-${format}-${backgrounds?'backgrounds':'default'}.pdf`),format,printBackground:backgrounds});
 }
 await exportState('free');
 for(const state of['purchased','pro']){access=state;await page.reload();await expect(page.locator('#market-analysis')).toBeVisible();await expect(page.locator('app-report-proof')).toHaveCount(0);await page.emulateMedia({media:'print'});expect(await page.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor)).toBe('rgb(255, 255, 255)');await exportState(state);await page.emulateMedia({media:'screen'});}
});
