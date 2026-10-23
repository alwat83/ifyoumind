import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll } from '../support/test.mjs';

const endpoint='**/getSampleDecisionReport';
const fail=route=>route.fulfill({status:503,json:{error:{message:'INTERNAL',status:'INTERNAL'}}});
function expectedFailureDiagnostics(errors){
  errors.allow.push(/\[ifYouMind\] Public sample report failed\./,/Failed to load resource: the server responded with a status of 503/);
}
async function accessible(page){
  const audit=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(audit.violations.map(v=>v.id)).toEqual([]);
  await expectNoHorizontalScroll(page);
}

test('sample recovers by keyboard and preserves the original diagnostic',async({page,consoleErrors},testInfo)=>{
  expectedFailureDiagnostics(consoleErrors);
  let calls=0;
  await page.route(endpoint,route=>++calls===1?fail(route):route.continue());
  await page.goto('/sample-report');
  await expect(page.getByRole('alert')).toContainText('We could not load the sample.');
  await expect(page.locator('main')).not.toContainText('INTERNAL');
  await expect(page.locator('h1')).toHaveCount(1);
  expect(consoleErrors.some(text=>/Public sample report failed.*INTERNAL/.test(text))).toBe(true);
  await accessible(page);
  await page.screenshot({path:testInfo.outputPath('sample-error.png'),fullPage:true,scale:'css'});
  const retry=page.getByRole('button',{name:'Try again',exact:true});
  await retry.focus();await page.keyboard.press('Enter');
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
  await expect(page.locator('article.report h1')).toBeFocused();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(page.locator('#sources a').first()).toHaveAttribute('href',/^https:/);
  expect(calls).toBe(2);
  await accessible(page);
  await page.screenshot({path:testInfo.outputPath('sample-recovered.png'),fullPage:true,scale:'css'});
});

test('persistent failure keeps useful content and free navigation without automatic retries',async({page,consoleErrors},testInfo)=>{
  expectedFailureDiagnostics(consoleErrors);
  let calls=0;await page.route(endpoint,route=>{calls++;return fail(route);});
  await page.goto('/sample-report');
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('The sample still could not load.');
  await expect(page.getByRole('alert')).toContainText('do not need to register or buy');
  await expect(page.locator('article.report')).toHaveCount(0);
  await expect(page.locator('.sample-state')).toContainText('Census sources and evidence limits');
  await page.waitForTimeout(250);expect(calls).toBe(2);
  await accessible(page);
  if(testInfo.project.name==='mobile'){
    await page.setViewportSize({width:320,height:568});await expectNoHorizontalScroll(page);
  }
  await page.screenshot({path:testInfo.outputPath('sample-persistent-error.png'),fullPage:true,scale:'css'});
  await page.getByRole('link',{name:'Read the free location guide'}).click();
  await expect(page).toHaveURL(/\/guides\/choose-business-location-evidence\/$/);
  await expect(page.locator('.prose')).toContainText('in development');
});

test('pending retry announces loading and rejects repeated keyboard activation',async({page,consoleErrors})=>{
  expectedFailureDiagnostics(consoleErrors);
  let calls=0,release;
  const held=new Promise(resolve=>{release=resolve;});
  await page.route(endpoint,async route=>{
    calls++;if(calls===1)return fail(route);
    await held;return route.continue();
  });
  try{
    await page.goto('/sample-report');
    await page.getByRole('button',{name:'Try again',exact:true}).focus();
    await page.keyboard.press('Space');
    const retry=page.getByRole('button',{name:'Trying again…',exact:true});
    await expect(retry).toHaveAttribute('aria-disabled','true');
    await expect(retry).toBeFocused();
    await expect(page.getByRole('status')).toHaveText('Loading the sample report…');
    await page.keyboard.press('Enter');await page.keyboard.press('Space');
    expect(calls).toBe(2);
    release();
    await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
  }finally{release();}
});

test('slow sample reaches a bounded timeout and can recover without a stale result',async({page,consoleErrors},testInfo)=>{
  expectedFailureDiagnostics(consoleErrors);
  let calls=0,release;
  const held=new Promise(resolve=>{release=resolve;});
  await page.clock.install();
  await page.route(endpoint,async route=>{
    if(++calls===1){await held;return fail(route);}
    return route.continue();
  });
  try{
    await page.goto('/sample-report',{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('status')).toHaveText('Loading the sample report…');
    await expect.poll(()=>calls).toBe(1);
    await page.clock.runFor(20_100);
    await expect(page.getByRole('alert')).toContainText('The sample is taking too long.');
    await page.screenshot({path:testInfo.outputPath('sample-timeout.png'),fullPage:true,scale:'css'});
    release();
    await page.getByRole('button',{name:'Try again',exact:true}).click();
    await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
    await expect(page.getByRole('alert')).toHaveCount(0);expect(calls).toBe(2);
  }finally{release();}
});

test('offline retry sends no request and recovers after the connection returns',async({page,context,consoleErrors},testInfo)=>{
  expectedFailureDiagnostics(consoleErrors);
  let calls=0;await page.route(endpoint,route=>++calls===1?fail(route):route.continue());
  await page.goto('/sample-report');
  await expect(page.getByRole('alert')).toBeVisible();
  await context.setOffline(true);
  try{
    await page.getByRole('button',{name:'Try again',exact:true}).click();
    await expect(page.getByRole('alert')).toContainText("You're offline.");
    expect(calls).toBe(1);
    await page.screenshot({path:testInfo.outputPath('sample-offline.png'),fullPage:true,scale:'css'});
  }finally{await context.setOffline(false);}
  await page.getByRole('button',{name:'Try again',exact:true}).click();
  await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');expect(calls).toBe(2);
});

test('leaving a pending sample keeps homepage discovery and Business registration usable',async({page})=>{
  let release;const held=new Promise(resolve=>{release=resolve;});
  await page.route(endpoint,async route=>{await held;return route.continue();});
  try{
    await page.goto('/sample-report',{waitUntil:'domcontentloaded'});
    await expect(page.getByRole('status')).toHaveText('Loading the sample report…');
    await page.getByRole('link',{name:'Back to the homepage',exact:true}).click();
    release();
    await expect(page.locator('h1')).toHaveText('Big decisions deserve better answers.');
    await page.getByRole('button',{name:/Explore a business opportunity/}).click();
    await page.getByRole('link',{name:'Start a free Business brief'}).click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByLabel('Email',{exact:true})).toBeVisible();
  }finally{release();}
});

test('losing the connection while loading releases the spinner immediately',async({page,context,consoleErrors})=>{
  expectedFailureDiagnostics(consoleErrors);
  let calls=0,release;
  const held=new Promise(resolve=>{release=resolve;});
  await page.route(endpoint,async route=>{
    if(++calls===1){await held;return fail(route);}
    return route.continue();
  });
  try{
    await page.goto('/sample-report',{waitUntil:'domcontentloaded'});
    await expect.poll(()=>calls).toBe(1);
    await context.setOffline(true);
    await expect(page.getByRole('alert')).toContainText("You're offline.");
    await expect(page.locator('[role="status"]')).toBeEmpty();
    await context.setOffline(false);release();
    await page.getByRole('button',{name:'Try again',exact:true}).click();
    await expect(page.locator('#recommendation h2')).toContainText('Austin, TX');
    expect(calls).toBe(2);
  }finally{await context.setOffline(false);release();}
});
