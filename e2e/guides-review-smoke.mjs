import { chromium } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { isolate } from './support/test.mjs';

const base = process.env.QA_BASE_URL || 'http://127.0.0.1:4303';
const output = 'docs/seo/2026-10-22/guides';
const slugs = ['compare-job-offers-relocation', 'choose-business-location-evidence', 'compare-options-with-your-own-data'];
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
try {
  for (const width of [390, 1280]) {
    const context = await isolate(await browser.newContext({ viewport: { width, height: 844 } }));
    const page = await context.newPage();
    for (const slug of slugs) {
      const response = await page.goto(`${base}/guides/${slug}/`);
      assert.equal(response.status(), 200);
      assert.equal(await page.locator('h1').count(), 1);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'), `https://ifyoumind.com/guides/${slug}/`);
      assert.ok(await page.locator('a[href="/sample-report"]').count() >= 2);
      assert.equal(await page.locator('a[href*="/life/quick-compare"], input[type="file"]').count(), 0);
      assert.ok((await page.locator('.prose').innerText()).includes('in development'));
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      assert.deepEqual(accessibility.violations.map(v => `${v.id}: ${v.nodes.length}`), []);
      await page.screenshot({ path: `${output}/${slug}-${width}.png`, fullPage: true });
      console.log(`PASS ${slug} ${width}px: metadata, Business links, honest scope, no overflow, 0 WCAG A/AA violations`);
    }
    await page.goto(`${base}/guides/`);
    for (const slug of slugs) assert.equal(await page.locator(`a[href="/guides/${slug}/"]`).count(), 1);
    assert.deepEqual(context.externalRequests, []);
    await context.close();
  }
} finally { await browser.close(); }
