// Consumer audit P0 (anonymous, real Hosting config): links go where they say, legal text reads cleanly.
import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const origin='http://127.0.0.1:4316';
test.beforeEach(async({context})=>{await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());});

test('the one-time report link stays on Pricing and moves focus to the $79 offer', async ({ page }) => {
  await page.goto('/pricing');
  const jump = page.getByRole('link', { name: /One-time report · \$79/ });
  await expect(jump).toHaveAttribute('href', '/pricing#one-time');
  const offer = page.getByRole('article', { name: 'One-time Decision Report' });
  await jump.click();
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(offer).toBeFocused();
  await expect(offer).toBeInViewport();
  await expect(page.getByRole('heading', { name: 'Start free. Go further.' })).toBeAttached();
});

test('the one-time report link also works from the keyboard', async ({ page }) => {
  await page.goto('/pricing');
  await page.getByRole('link', { name: /One-time report · \$79/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/pricing$/);
  await expect(page.getByRole('article', { name: 'One-time Decision Report' })).toBeFocused();
});

test('legal pages: support links are distinguishable and retention periods read correctly', async ({ page }) => {
  await page.goto('/terms-of-conduct');
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  await expect(page.getByRole('link', { name: 'support@ifyoumind.com' })).toHaveCSS('text-decoration-line', 'underline');
  await page.goto('/privacy-policy');
  await expect(page.locator('main')).toContainText('retained for up to 180 days, with analytics cookies configured for 30 days');
});

// Consumer audit P1: people with paper bills can type two bills without building a CSV. Browser-local only.
test('a visitor can type two property-tax bills and get the same evidence-backed findings', async ({ page }) => {
  const requests = [];
  // Typed values never leave the tab: no request other than same-origin static GETs.
  page.on('request', r => { if (r.method() !== 'GET' || !r.url().startsWith(origin + '/')) requests.push(`${r.method()} ${r.url()}`); });
  await page.goto('/discover/');
  await page.getByRole('button', { name: 'Type my property tax bills' }).click();
  const editor = page.locator('#editor');
  await expect(editor.getByRole('heading', { name: 'Type the amounts from your two bills.' })).toBeVisible();
  await expect(editor.getByRole('group', { name: 'Earlier bill' })).toBeVisible();
  await expect(editor.getByRole('textbox', { name: 'Earlier bill Tax year' })).toBeFocused();
  await expect(page.getByText('Your numbers, on this device.')).toBeVisible();
  const values = { 'Tax year': ['2024', '2025'], County: ['900', '990'], School: ['2400', '2640'], Municipal: ['900', '990'], 'Total billed': ['4200', '4620'] };
  for (const [label, [earlier, later]] of Object.entries(values)) {
    await editor.getByRole('textbox', { name: new RegExp(`^Earlier bill ${label}`) }).fill(earlier);
    await editor.getByRole('textbox', { name: new RegExp(`^Later bill ${label}`) }).fill(later);
  }
  await editor.getByRole('button', { name: 'Show what changed' }).click();
  await expect(page.locator('.finding')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Here’s what changed.' })).toBeFocused();
  await page.getByText('Show source cells & calculation').first().click();
  await expect(page.getByText(/Your typed numbers · Cells use the CSV layout/).first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Edit my numbers' })).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  await page.getByRole('button', { name: 'Clear my data' }).first().click();
  await expect(page.locator('.finding')).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('typing is offered from the CSV step, the example result and a deep link, and explains missing values', async ({ page }) => {
  await page.goto('/discover/?example=tax&input=csv');
  await page.getByRole('button', { name: 'Type the numbers from your two bills' }).click();
  await expect(page.getByRole('textbox', { name: 'Earlier bill Tax year' })).toBeFocused();
  await page.locator('#editor').getByRole('button', { name: 'Show what changed' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'No findings yet' })).toContainText('We need two complete annual statements.');
  await expect(page.locator('#editor')).toBeVisible();
  await page.goto('/discover/?example=tax');
  await page.getByRole('button', { name: 'Type my two bills' }).click();
  await expect(page.getByRole('textbox', { name: 'Earlier bill Tax year' })).toBeFocused();
  await page.goto('/discover/?example=electricity&input=type');
  await expect(page.getByRole('textbox', { name: 'Earlier bill Usage unit' })).toHaveValue('kWh');
  await expect(page.getByRole('textbox', { name: 'Later bill Currency' })).toHaveValue('USD');
  await expect(page.getByRole('textbox', { name: /^Earlier bill Charge/ })).toHaveValue('unknown');
});

// Consumer audit P1: what can be bought today comes first; closed plans stay listed and labelled.
test('Pricing leads with free and one-time choices and keeps closed monthly plans visible as unavailable', async ({ page }) => {
  await page.goto('/pricing');
  await expect(page.locator('.lede')).toHaveText('Checking a bill is free, needs no account and stays in your browser. Decision Reports compare U.S. cities for a move or a business: up to three cities, sourced analysis and an action plan.');
  const payOnce = page.getByRole('region', { name: 'Start free, or pay once' });
  const monthly = page.getByRole('region', { name: 'Monthly subscriptions' });
  const order = await page.evaluate(() => [...document.querySelectorAll('section.offer-section h2')].map(h => h.textContent.trim()));
  expect(order).toEqual(['Start free, or pay once', 'Monthly subscriptions']);
  await expect(payOnce).toContainText('type your numbers');
  await expect(monthly).toContainText('Monthly enrollment is currently unavailable.');
  for (const name of ['Starter', 'Plus']) await expect(monthly.getByRole('button', { name: `${name} enrollment currently unavailable` })).toBeDisabled();
  await expect(monthly).toContainText('$4.99');
  await expect(monthly).toContainText('$9.99');
  await expect(page.getByText(/Paid reports use public city and market evidence/)).toBeVisible();
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
});

test('the homepage offer separates the free bill check from paid city reports', async ({ page }) => {
  await page.goto('/');
  const reports = page.getByRole('region', { name: 'Decision Reports', exact: true });
  await expect(reports).toContainText('Choosing between U.S. cities?');
  await expect(reports).toContainText('Checking a bill stays free, needs no account and runs in your browser. Paid reports don’t analyze household bills.');
});
