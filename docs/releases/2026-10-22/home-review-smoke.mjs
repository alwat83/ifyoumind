import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
 for (const width of [390,1280]) {
  const page=await browser.newPage({viewport:{width,height:844}});
  await page.goto('http://127.0.0.1:4302/');
  await page.getByRole('heading',{name:'Your question. The evidence. A clearer decision.'}).waitFor();
  await page.getByRole('link',{name:/For your life/}).click();
  await page.getByRole('heading',{name:'Two job offers. More than two salaries.'}).waitFor();
  assert.ok((await page.locator('#life-preview').textContent()).includes('does not calculate'));
  assert.equal(await page.locator('a[href="/life/quick-compare"]').count(),0);
  assert.ok(await page.locator('a[href="/sample-report"]').count()>0);
  assert.ok((await page.locator('#pricing').textContent()).includes('$79'));
  assert.ok((await page.locator('#pricing').textContent()).includes('$39'));
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`/private/tmp/ifyoumind-home-${width}.png`,fullPage:true});
  await page.close(); console.log(`PASS ${width}px: Life anchor and disclosures, Business sample links, prices, no calculator links or overflow`);
 }
} finally {await browser.close();}
