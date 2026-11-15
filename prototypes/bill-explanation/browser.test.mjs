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

const cases = [
  ['tax-single', /\$4,620\.37.*2026/, /\$385\.03 per month/],
  ['tax-pair', /\$420\.37/, /\$4,200\.00/],
  ['electricity', /\$145\.20/, /\$0\.2200 per kWh/],
  ['missing-usage', /needs more evidence/, /Enter billed kWh/],
  ['incompatible-years', /needs more evidence/, /immediately before/],
];

for (const [name, engine, options] of sizes) test(`${name}: five scenarios x three modes, common evidence, keyboard and offline`, async () => {
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
      const mode = page.getByLabel('Presentation');
      const finding = page.getByRole('heading', { level: 1 });
      const explanation = page.getByRole('region', { name: 'What stands out' });
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

      const postLoad = requests.length;
      assert.ok(requests.every(request => request.startsWith(url)));
      await context.setOffline(true);

      for (const [scenario, title, supportingText] of cases) {
        const invalid = scenario === 'missing-usage' || scenario === 'incompatible-years';
        await fixture.selectOption(scenario);
        await mode.selectOption('1');
        const original = () => page.locator('#finding, #detail, #validation, #arithmetic, #figures').allTextContents();
        const common = await original();
        assert.match(await finding.innerText(), title);
        assert.match(common.join(' '), supportingText);

        for (const presentation of ['1', '2', '3']) {
          await mode.selectOption(presentation);
          if (invalid || presentation === '1') {
            assert.equal(await explanation.count(), 0);
            assert.equal(await page.locator('#observations li').count(), 0);
          } else {
            await explanation.waitFor();
            assert.equal(await explanation.getByRole('listitem').count(), 2);
            assert.match(await explanation.innerText(), /Next:/);
          }
          assert.deepEqual(await original(), common);
          await withinViewport();
          if (name === 'desktop' && scenario === 'tax-pair') await axe();
        }
      }

      await fixture.selectOption('tax-pair');
      const evidenceButton = page.getByRole('button', { name: 'Evidence: Annual property tax' });
      await evidenceButton.focus();
      await page.keyboard.press('Enter');
      assert.equal(await page.evaluate(() => document.activeElement.id), 'evidence-toggle');
      await page.getByText('$4,620.37', { exact: true }).waitFor();
      assert.deepEqual(requests.slice(postLoad), []);
      assert.deepEqual(await page.evaluate(() => [localStorage.length, sessionStorage.length, document.cookie]), [0, 0, '']);

      await context.setOffline(false);
      for (const [view, letter] of [['1', 'a'], ['2', 'b'], ['3', 'c']]) {
        await page.goto(`${url}?bill=tax-pair&view=${view}`);
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await mode.isVisible(), false);
        assert.equal(await fixture.isVisible(), false);
        assert.equal(await page.getByRole('combobox').count(), 0);
        assert.match(await finding.innerText(), /\$420\.37/);
        if (view === '1') assert.equal(await explanation.count(), 0);
        else {
          await explanation.waitFor();
          assert.match(await page.locator('#takeaway').innerText(), view === '2' ? /budgeting/ : /itemized bills/);
        }
        await withinViewport();
        await capture(letter);
      }
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
