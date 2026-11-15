import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test } from 'node:test';
import AxeBuilder from '@axe-core/playwright';
import { chromium, devices, webkit } from 'playwright';
import { startReview } from './serve.mjs';

const captures = process.env.IFYOUMIND_EXPLANATION_CAPTURES;
const chromiumChannel = process.env.IFYOUMIND_EXPLANATION_CHROMIUM_CHANNEL;
const sizes = [
  ['small', chromium, { viewport: { width: 320, height: 720 }, isMobile: true, hasTouch: true }],
  ['mobile', chromium, { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['safari', webkit, devices['iPhone 15']],
  ['tablet', chromium, { viewport: { width: 768, height: 1024 }, hasTouch: true }],
  ['desktop', chromium, { viewport: { width: 1280, height: 900 } }],
];

for (const [name, engine, options] of sizes) test(`${name}: consent, evidence, keyboard, no overflow and offline mock`, async () => {
  const { server, url } = await startReview();
  try {
    const browser = await engine.launch(engine === chromium && chromiumChannel ? { channel: chromiumChannel } : {});
    try {
      const context = await browser.newContext({ ...options, reducedMotion: 'reduce', deviceScaleFactor: 1 });
      const page = await context.newPage();
      const requests = [];
      const errors = [];
      page.on('request', request => requests.push(request.url()));
      page.on('pageerror', error => errors.push(error.message));
      const response = await page.goto(url, { waitUntil: 'networkidle' });
      assert.match(response.headers()['content-security-policy'], /connect-src 'none'/);
      await page.evaluate(() => document.fonts.ready);
      const fixture = page.getByLabel('Made-up bill');
      const finding = page.getByRole('heading', { level: 1 });
      const explain = page.getByRole('button', { name: 'Explain my findings' });
      const heading = page.getByRole('heading', { name: 'What stands out' });
      const consent = page.getByRole('heading', { name: 'Try the explanation preview' });
      const withinViewport = async () => assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
      const axe = async () => {
        const result = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        assert.deepEqual(result.violations.map(({ id }) => id), []);
      };
      const capture = async phase => {
        if (!captures || !['mobile', 'desktop'].includes(name)) return;
        await mkdir(captures, { recursive: true });
        await page.screenshot({ path: join(captures, `${name}-${phase}.png`), fullPage: true, animations: 'disabled' });
      };

      await fixture.selectOption('tax-pair');
      assert.match(await finding.innerText(), /\$420\.37/);
      const baseline = await finding.innerText();
      await withinViewport();
      await capture('local');
      await explain.focus();
      await page.keyboard.press('Enter');
      await consent.waitFor();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'consent-title');
      if (name === 'desktop') await axe();
      await page.getByRole('button', { name: 'Keep the local result' }).click();
      assert.equal(await heading.count(), 0);
      assert.equal(await finding.innerText(), baseline);
      const postLoad = requests.length;
      assert.ok(requests.every(request => request.startsWith(url)));
      await context.setOffline(true);
      await explain.click();
      await page.getByRole('button', { name: 'Try the mock explanation' }).click();
      await heading.waitFor();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'explanation-title');
      assert.equal(await finding.innerText(), baseline);
      assert.match(await page.locator('#limit').innerText(), /cannot establish why/);
      assert.match(await page.locator('#next').innerText(), /itemized statements/);
      await withinViewport();
      await capture('explained');
      if (name === 'desktop') await axe();
      await page.getByRole('button', { name: 'Evidence: Annual property tax' }).click();
      assert.equal(await page.evaluate(() => document.activeElement.id), 'evidence-toggle');
      await page.getByText('$4,620.37', { exact: true }).waitFor();
      await fixture.selectOption('electricity');
      assert.equal(await heading.count(), 0);
      assert.match(await finding.innerText(), /\$145\.20/);
      await explain.click();
      await page.getByRole('button', { name: 'Try the mock explanation' }).click();
      assert.match(await page.locator('#limit').innerText(), /not a tariff/);
      await page.getByRole('button', { name: 'Hide explanation' }).click();
      assert.equal(await heading.count(), 0);
      await fixture.selectOption('missing-usage');
      assert.match(await page.locator('#validation').innerText(), /Enter billed kWh/);
      assert.equal(await explain.count(), 0);
      await fixture.selectOption('incompatible-years');
      assert.match(await page.locator('#validation').innerText(), /immediately before/);
      assert.equal(await explain.count(), 0);
      await withinViewport();
      assert.deepEqual(requests.slice(postLoad), []);
      assert.deepEqual(errors, []);
      assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]), [0, 0, '']);
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
