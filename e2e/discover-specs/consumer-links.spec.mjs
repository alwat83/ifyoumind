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
