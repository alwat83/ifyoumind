import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { homepageHeadingContrasts } from '../support/homepage-contrast.mjs';

const origin = 'http://127.0.0.1:4316';
const sizesByProject = {
  desktop: [[1024, 768], [1440, 900]],
  mobile: [[375, 812], [390, 844]],
  narrow: [[320, 568], [768, 1024]],
};

test.beforeEach(async ({ context }) => {
  await context.route('**/*', route =>
    new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
});

async function noOverflow(page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
}

async function accessible(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(results.violations).toEqual([]);
}

test('homepage fits six reference widths with a visible example action and readable comparison', async ({ page }, info) => {
  for (const [width, height] of sizesByProject[info.project.name]) {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/See the story\.\s*Check the evidence\./);
    const heroAction = page.getByRole('link', { name: 'Try a Free Example', exact: true });
    await expect(heroAction).toBeInViewport({ ratio: 1 });
    await expect(heroAction).toHaveAttribute('href', '/discover/?example=electricity');
    await expect(page.getByRole('link', { name: 'Create a Report' })).toHaveAttribute('href', '/app/decide');
    const table = page.getByRole('table', { name: 'City estimates from the public Business sample' });
    await expect(table.getByRole('columnheader', { name: 'Austin, TX' })).toBeVisible();
    await expect(table.getByRole('columnheader', { name: 'Charlotte, NC' })).toBeVisible();
    await expect(table.getByRole('rowheader', { name: 'Median household income' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '$93,658', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: '+5.4%', exact: true })).toBeVisible();
    await expect(page.locator('#data-sources')).toContainText('2015–2019 with 2020–2024');
    const images = page.locator('.hero-art img, .use-case img');
    await expect(images).toHaveCount(5);
    await images.evaluateAll(async nodes => {
      for (const img of nodes) {
        img.loading = 'eager';
        await img.decode();
      }
    });
    await noOverflow(page);
    await accessible(page);
    const headings = await homepageHeadingContrasts(page);
    expect(headings).toHaveLength(13);
    for (const heading of headings) {
      expect(heading.minimumRatio, heading.text).toBeGreaterThanOrEqual(heading.fontSize >= 24 ? 3 : 4.5);
    }
    await page.screenshot({ path: info.outputPath(`homepage-${width}.png`), fullPage: true, scale: 'css' });
  }
});

test('primary action opens electricity findings and the explore card offers both bill examples', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try a Free Example', exact: true }).click();
  await expect(page).toHaveURL(origin + '/discover/?example=electricity');
  await expect(page.locator('.finding')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'Your total rose by $25.20.', exact: true })).toBeVisible();
  await page.goto('/');
  await page.getByRole('link', { name: /Understand Your Bills/ }).click();
  await expect(page).toHaveURL(origin + '/discover/');
  await page.getByRole('button', { name: 'Try property tax example', exact: true }).click();
  await expect(page.locator('.finding')).toHaveCount(3);
  await page.locator('.finding summary').first().click();
  await expect(page.getByRole('table')).toContainText('4200.00');
  await expect(page.getByRole('table')).toContainText('4620.00');
});

test('example query allowlist and private offline discovery are preserved', async ({ page, context }) => {
  await page.goto('/discover/?example=unknown&file=private.csv');
  await expect(page.locator('.finding')).toHaveCount(0);
  await page.goto('/discover/?example=electricity');
  await expect(page.locator('.finding')).toHaveCount(5);
  await context.setOffline(true);
  await page.locator('.finding summary').first().click();
  await expect(page.getByRole('table')).toContainText('145.20');
  expect(await page.evaluate(() => Object.keys(localStorage))).toEqual([]);
  expect(await page.evaluate(() => Object.keys(sessionStorage))).toEqual([]);
  await page.getByRole('button', { name: 'Clear & choose another', exact: true }).click();
  await page.getByRole('button', { name: 'Try property tax example', exact: true }).click();
  await expect(page.locator('.finding')).toHaveCount(3);
  await context.setOffline(false);
});

test('homepage navigation, guides, legal pages and report offers lead to existing destinations', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'View the Full Sample Report' })).toHaveAttribute('href', '/sample-report');
  const paths = await page.locator('a[href^="/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))]);
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
  const pricing = page.locator('#pricing');
  await expect(pricing).toContainText('$79');
  await expect(pricing).toContainText('$39');
  await expect(pricing).toContainText('Five full reports each month');
  await expect(pricing.getByRole('link', { name: /Business brief/ })).toHaveAttribute('href', '/register');
  await expect(pricing.getByRole('link', { name: /Business Pro/ })).toHaveAttribute('href', '/register');
  await expect(pricing.getByRole('link', { name: 'See Pricing' })).toHaveAttribute('href', '/app/pricing');
  await pricing.getByRole('link', { name: /Decision Report/ }).click();
  await expect(page).toHaveURL(/\/register\?intent=report$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});

test('keyboard opens the compact menu, Escape restores focus, and text spacing preserves actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const menu = page.locator('.mobile-navigation');
  const summary = menu.locator('summary');
  await summary.focus();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('open', '');
  await menu.getByRole('link', { name: 'Explore' }).focus();
  await page.keyboard.press('Escape');
  await expect(menu).not.toHaveAttribute('open');
  await expect(summary).toBeFocused();
  expect(await page.locator('.hero .primary').evaluate(node => getComputedStyle(node).transitionDuration)).toBe('0s');
  await page.addStyleTag({ content: '*{line-height:1.5!important;letter-spacing:.12em!important;word-spacing:.16em!important}p{margin-bottom:2em!important}' });
  await page.setViewportSize({ width: 320, height: 568 });
  await noOverflow(page);
  await expect(page.getByRole('link', { name: 'Try a Free Example', exact: true })).toBeVisible();
  await page.emulateMedia({ forcedColors: 'active' });
  await summary.focus();
  expect(await summary.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
});
