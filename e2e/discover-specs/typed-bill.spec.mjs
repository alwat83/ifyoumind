import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const taxEntry = page => page.getByRole('button', { name: 'Enter property tax numbers' });
const electricEntry = page => page.getByRole('button', { name: 'Enter electricity numbers' });
const result = page => page.getByRole('heading', { level: 1 });
const register = page => page.getByRole('link', { name: 'Create a free account' });
const evidence = page => page.getByText('Show the evidence', { exact: true });
const wcag = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const clear = page => page.getByRole('button', { name: 'Clear my data' });

async function expectAccessible(page) {
  expect((await new AxeBuilder({ page }).withTags(wcag).analyze()).violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
}

async function fill(group, fields) {
  for (const [label, value] of Object.entries(fields)) await group.getByLabel(label, { exact: true }).fill(value);
}

test('typed tax is offline, private, accessible and correct through correction, comparison and reset', async ({ page, context }, info) => {
  if (info.project.name === 'desktop') await page.setViewportSize({ width: 1440, height: 1000 });
  const requests = [];
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  context.on('request', request => requests.push(request));
  await page.goto('/discover/');
  await page.evaluate(() => document.fonts.ready.then(() => undefined));
  await page.waitForLoadState('networkidle');
  const requestCount = requests.length;
  await context.setOffline(true);
  await page.emulateMedia({ reducedMotion: 'reduce', forcedColors: 'active' });
  await taxEntry(page).focus();
  await expect(taxEntry(page)).toHaveCSS('outline-style', 'solid');
  await page.keyboard.press('Enter');
  await expect(result(page)).toBeFocused();
  await expect(page.locator('#typed-privacy')).toContainText('Your numbers stay in this tab');
  await expect(register(page)).toHaveCount(0);
  await page.getByRole('button', { name: 'Show my result' }).click();
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByLabel('Tax year', { exact: true })).toHaveAttribute('aria-invalid', 'true');
  await expectAccessible(page);
  const current = page.getByRole('group', { name: 'Current bill' });
  await fill(current, { 'Tax year': '2026', 'Annual property tax (USD)': '$4,620.37' });
  await current.getByLabel('Annual property tax (USD)').press('Enter');
  await expect(result(page)).toHaveText('$4,620.37 in 2026 property tax.');
  await expect(result(page)).toBeFocused();
  await expect(register(page)).toHaveAttribute('href', '/register');
  await evidence(page).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('table')).toContainText('$4,620.37');
  await expect(page.getByRole('main')).toContainText('$385.03 per month');
  await expectAccessible(page);
  await page.getByRole('button', { name: 'Compare with an earlier bill' }).click();
  const earlier = page.getByRole('group', { name: 'Earlier bill' });
  await expect(earlier.getByLabel('Tax year')).toBeFocused();
  await expect(register(page)).toHaveCount(0);
  await fill(earlier, { 'Tax year': '2025', 'Annual property tax (USD)': '4200' });
  await page.getByRole('button', { name: 'Compare bills' }).click();
  await expect(page.getByText('Confirm both bills are for the same property.')).toBeVisible();
  await page.getByRole('checkbox', { name: /same property/ }).check();
  await page.getByRole('button', { name: 'Compare bills' }).click();
  await expect(result(page)).toHaveText('Your total rose by $420.37.');
  await page.getByRole('button', { name: 'Edit numbers' }).click();
  await expect(result(page)).toBeFocused();
  await expect(current.getByLabel('Annual property tax (USD)')).toHaveValue('$4,620.37');
  await page.getByRole('button', { name: 'Remove earlier bill' }).click();
  await expect(earlier).toHaveCount(0);
  await clear(page).click();
  await expect(current.getByLabel('Annual property tax (USD)')).toHaveValue('');
  await expect(page.getByRole('status')).toHaveText('Your bill details were cleared from this page.');
  await expect(register(page)).toHaveCount(0);
  const persisted = await page.evaluate(async () => ({
    local: localStorage.length, session: sessionStorage.length, idb: (await indexedDB.databases()).length,
    caches: (await caches.keys()).length, cookies: document.cookie,
  }));
  expect(persisted).toEqual({ local: 0, session: 0, idb: 0, caches: 0, cookies: '' });
  expect(await context.cookies()).toEqual([]);
  expect(requests.slice(requestCount).map(request => request.url())).toEqual([]);
});

test('typed electricity compares amounts and usage and clears before registration or history restoration', async ({ page, context }) => {
  await context.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
  await page.goto('/discover/');
  await electricEntry(page).click();
  const current = page.getByRole('group', { name: 'Current bill' });
  await fill(current, {
    'Current electric charges (USD)': '145.20', 'Electricity used (kWh)': '660',
    'Start meter-read date': '2026-07-01', 'End meter-read date': '2026-08-01',
  });
  await page.getByRole('button', { name: 'Show my result' }).click();
  await expect(result(page)).toHaveText('$145.20 in electric charges.');
  await expect(page.getByRole('main')).toContainText('$0.2200 per kWh');
  await page.getByRole('button', { name: 'Compare with an earlier bill' }).click();
  await fill(page.getByRole('group', { name: 'Earlier bill' }), {
    'Current electric charges (USD)': '120', 'Electricity used (kWh)': '600',
    'Start meter-read date': '2026-06-01', 'End meter-read date': '2026-07-02',
  });
  await page.getByRole('checkbox', { name: /same electric service/ }).check();
  await page.getByRole('button', { name: 'Compare bills' }).click();
  await expect(page.getByText(/ends on or before the current start date/)).toBeVisible();
  await page.getByRole('group', { name: 'Earlier bill' }).getByLabel('End meter-read date').fill('2026-07-01');
  await page.getByRole('button', { name: 'Compare bills' }).click();
  await expect(result(page)).toHaveText('Your total rose by $25.20.');
  await expect(page.getByRole('main')).toContainText('21.3 versus 20 kWh/day');
  await evidence(page).click();
  await expect(page.getByRole('table')).toContainText('600 kWh');
  await expectAccessible(page);
  const request = page.waitForRequest(req => req.isNavigationRequest() && new URL(req.url()).pathname === '/register');
  await register(page).click();
  const navigation = await request;
  expect(new URL(navigation.url()).search).toBe('');
  expect(navigation.method()).toBe('GET');
  expect(navigation.postData()).toBeNull();
  expect((await navigation.allHeaders()).referer).toBeUndefined();
  await expect(page).toHaveURL(/\/register$/);
  await page.goBack();
  await expect(electricEntry(page)).toBeVisible();
  await electricEntry(page).click();
  await expect(current.getByLabel('Current electric charges (USD)')).toHaveValue('');
  await fill(current, { 'Current electric charges (USD)': '193.47' });
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pagehide'));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
  await expect(electricEntry(page)).toBeVisible();
  await taxEntry(page).click();
  await expect(page.getByLabel('Annual property tax (USD)')).toHaveValue('');
});

test('a stale private CSV read cannot replace a typed result', async ({ page }) => {
  await page.goto('/discover/');
  await page.evaluate(() => {
    const read = File.prototype.text;
    File.prototype.text = function () {
      return new Promise(resolve => {
        window.releaseDiscoveryRead = () => read.call(this).then(resolve);
      });
    };
  });
  await page.getByRole('button', { name: 'Use a property tax CSV' }).click();
  await page.getByLabel('Choose a redacted CSV').setInputFiles({
    name: 'synthetic.csv', mimeType: 'text/csv',
    buffer: Buffer.from('tax_year,county_usd,school_usd,municipal_usd,total_usd\n2024,1,2,3,6\n2025,2,4,6,12\n'),
  });
  await expect(page.getByRole('status')).toContainText('Reading');
  await page.getByRole('button', { name: 'Clear & choose another' }).click();
  await taxEntry(page).click();
  await fill(page.getByRole('group', { name: 'Current bill' }), { 'Tax year': '2026', 'Annual property tax (USD)': '4620' });
  await page.getByRole('button', { name: 'Show my result' }).click();
  await page.evaluate(() => window.releaseDiscoveryRead());
  await expect(result(page)).toHaveText('$4,620.00 in 2026 property tax.');
  await expect(page.locator('.finding')).toHaveCount(0);
});
