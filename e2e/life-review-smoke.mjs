import { chromium } from '@playwright/test';
import assert from 'node:assert/strict';
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [390, 1280]) {
    const page = await browser.newPage({viewport:{width,height:844}});
    await page.goto(`${process.env['LIFE_REVIEW_URL'] || 'http://127.0.0.1:4301'}/life/quick-compare`);
    await page.getByRole('heading', {name:'Which job offer fits your life?'}).waitFor();
    const salary = page.getByLabel('Annual salary ($)').first();
    await salary.fill('');
    await page.getByText('Enter nonnegative, realistic amounts').waitFor();
    assert.equal(await page.locator('.numbers').count(),0);
    await salary.fill('72000');
    await page.locator('.numbers').waitFor();
    await page.getByLabel('City or label').first().fill('Long city label '.repeat(5));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    await page.screenshot({path:`/private/tmp/ifyoumind-life-${width}.png`,fullPage:true});
    await page.close();
    console.log(`PASS ${width}px: edits, missing input, recovery, long label, no overflow`);
  }
} finally { await browser.close(); }
