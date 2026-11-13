import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { homepageHeadingContrasts } from '../support/homepage-contrast.mjs';

const origin = 'http://127.0.0.1:4316';
const sizesByProject = {
  desktop: [[1024, 800], [1440, 900]],
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

test('homepage fits six reference widths with the flagship result and an actionable hero', async ({ page }, info) => {
  for (const [width, height] of sizesByProject[info.project.name]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/See the story\.\s*Check the evidence\./);
    const heroAction = page.getByRole('link', { name: 'Try a Free Example', exact: true });
    await expect(heroAction).toBeInViewport({ ratio: 1 });
    await expect(heroAction).toHaveAttribute('href', '#business');
    const image = page.locator('.hero-art img');
    await expect(image).toBeInViewport();
    await expect(image).toHaveAttribute('alt', '');
    await image.evaluate(async img => {
      await document.fonts.ready;
      await img.decode();
    });
    expect(await page.evaluate(() => [...document.fonts]
      .filter(font => font.family.includes('Instrument Serif') && font.status === 'loaded').length)).toBe(2);
    await heroAction.focus();
    await page.keyboard.press('Enter');
    await expect(page).toHaveURL(origin + '/#business');
    await expect(page.locator('#business')).toBeFocused();
    await expect(page.locator('#try').getByRole('link')).toHaveCount(1);
    await expect(page.locator('#try')).toContainText('Find what changed in a bill or what sets two places apart.');
    const reports = page.getByRole('region', { name: 'Decision Reports', exact: true });
    await expect(reports.getByRole('link', { name: 'Start a Free Brief' })).toHaveAttribute('href', '/app/decide?type=business');
    await expect(reports).toContainText('A full Decision Report adds more comparisons, a sourced market analysis, and an action plan.');
    await expect(reports.getByRole('link', { name: 'View a Sample Report' })).toHaveAttribute('href', '/sample-report');
    const feature = page.locator('#business');
    await expect(feature.getByRole('button', { pressed: true })).toHaveText('Property taxes');
    await expect(feature.getByText('Made-up example', { exact: true })).toBeVisible();
    await expect(feature.locator('.finding')).toContainText('57.1% of the $420 increase came from school charges.');
    await expect(feature.getByText('57.1%', { exact: true })).toBeInViewport({ ratio: 1 });
    await expect(feature.getByText('of the $420 increase came from school charges.', { exact: true })).toBeVisible();
    await expect(feature.locator('.home-evidence summary')).toBeInViewport({ ratio: 1 });
    const chart = feature.getByRole('figure', { name: 'What went up' });
    await expect(chart).toContainText('+$420.00');
    await expect(chart).toContainText('+$240.00');
    await expect(chart).toContainText('Total tax increase');
    await expect(chart).toContainText('School charge increase');
    const axis = width <= 740 ? 'width' : 'height';
    const [total, school] = await chart.locator('.bar-fill').evaluateAll((bars, axis) =>
      bars.map(bar => bar.getBoundingClientRect()[axis]), axis);
    expect(total).toBeGreaterThan(0);
    expect(school / total).toBeCloseTo(240 / 420, 3);
    await expect(feature.getByRole('table')).toHaveCount(0);
    await expect(feature.locator('.home-evidence')).not.toHaveAttribute('open');
    await expect(feature.getByRole('link', { name: 'Explore the property-tax example' })).toHaveAttribute('href', '/discover/?example=tax');
    const targets = feature.locator('.question-option, summary');
    for (const { width: w, height: h } of await targets.evaluateAll(nodes => nodes.map(node => node.getBoundingClientRect().toJSON()))) {
      expect(w).toBeGreaterThanOrEqual(44);
      expect(h).toBeGreaterThanOrEqual(44);
    }
    await noOverflow(page);
    await accessible(page);
    const headings = await homepageHeadingContrasts(page);
    expect(headings).toHaveLength(6);
    for (const heading of headings) {
      expect(heading.minimumRatio, heading.text).toBeGreaterThanOrEqual(heading.fontSize >= 24 ? 3 : 4.5);
    }
    await page.evaluate(() => scrollTo(0, 0));
    await page.screenshot({ path: info.outputPath(`homepage-${width}.png`), fullPage: true, scale: 'css' });
  }
});

test('the three examples replace the finding, reset evidence and announce the new answer', async ({ page }, info) => {
  for (const [width, height] of sizesByProject[info.project.name]) {
    await page.setViewportSize({ width, height });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const feature = page.locator('#business');
    const city = feature.getByRole('button', { name: 'Compare cities', exact: true });
    const electricity = feature.getByRole('button', { name: 'Electricity bills', exact: true });
    const tax = feature.getByRole('button', { name: 'Property taxes', exact: true });
    const evidence = feature.locator('details');
    const summary = evidence.locator('summary');
    const announcement = feature.getByRole('status');

    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(summary).toBeFocused();
    await expect(evidence).toHaveAttribute('open', '');
    await expect(evidence).toContainText('School: $2,640.00 − $2,400.00 = +$240.00');
    await expect(evidence.locator('.evidence-content > p').first()).toHaveText('($240.00 ÷ $420.00) × 100 = 57.1%');
    await expect(evidence.getByText('($240.00 ÷ $420.00) × 100 = 57.1%', { exact: true })).toHaveCount(1);
    await expect(evidence.getByRole('table', { name: 'Total tax source cells' })).toContainText('4200.00');
    await expect(evidence.getByRole('table', { name: 'Total tax source cells' })).toContainText('4620.00');
    await expect(evidence.getByRole('table', { name: 'How the charges add up source cells' })).toContainText('2640.00');
    await expect(evidence.getByText(/Check assessed value and tax rates/)).toBeVisible();
    const fullTax = feature.getByRole('link', { name: 'Explore the property-tax example' });
    await expect(fullTax).toBeVisible();
    await expect(fullTax).toHaveAttribute('href', '/discover/?example=tax');
    expect((await fullTax.boundingBox()).height).toBeGreaterThanOrEqual(44);
    await noOverflow(page);
    await accessible(page);

    await electricity.focus();
    await page.keyboard.press('Enter');
    await expect(electricity).toBeFocused();
    await expect(feature.getByRole('button', { pressed: true })).toHaveText('Electricity bills');
    await expect(tax).toHaveAttribute('aria-pressed', 'false');
    await expect(evidence).not.toHaveAttribute('open');
    await expect(announcement).toContainText('The bill rose 21% and electricity use rose 10%.');
    await expect(feature.getByText('Made-up example', { exact: true })).toBeVisible();
    await expect(feature.locator('.finding')).toContainText('+21% in total billed, compared with +10% in electricity use.');
    await expect(feature.getByRole('link', { name: 'Explore the electricity example' })).toHaveAttribute('href', '/discover/?example=electricity');
    await expect(page).toHaveURL(origin + '/');
    const electricityChart = feature.getByRole('figure', { name: 'Change over the same billing period' });
    await expect(electricityChart).toContainText('+21%');
    await expect(electricityChart).toContainText('+10%');
    expect(await electricityChart.locator('.bar-fill').first().evaluate(node => getComputedStyle(node).animationName)).toBe('none');
    await noOverflow(page);
    await accessible(page);
    await feature.screenshot({ path: info.outputPath(`electricity-${width}.png`), scale: 'css' });

    await summary.click();
    await expect(evidence).toContainText('$145.20 − $120.00 = +$25.20');
    await expect(evidence).not.toContainText('$2,640.00');
    await expect(evidence.getByRole('table', { name: 'Energy used source cells' })).toContainText('E3');
    await expect(evidence.getByRole('table', { name: 'Energy used source cells' })).toContainText('660');
    await noOverflow(page);
    await accessible(page);

    await city.click();
    await expect(feature.getByRole('button', { pressed: true })).toHaveText('Compare cities');
    await expect(evidence).not.toHaveAttribute('open');
    await expect(announcement).toContainText('median household income estimate is $11,590 higher');
    const cityChart = feature.getByRole('figure', { name: 'Estimated median household income' });
    await expect(cityChart).toContainText('$93,658');
    await expect(cityChart).toContainText('$82,068');
    await expect(feature.getByRole('link', { name: 'View the Full Sample Report' })).toHaveAttribute('href', '/sample-report');
    await summary.click();
    const table = evidence.getByRole('table', { name: 'City estimates from the public Business sample' });
    for (const cityName of ['Austin, TX', 'Charlotte, NC']) {
      await expect(table.getByRole('columnheader', { name: cityName })).toBeVisible();
    }
    await expect(table.getByRole('rowheader', { name: 'Median household income' })).toBeVisible();
    await expect(table.getByRole('cell', { name: '$93,658', exact: true })).toBeVisible();
    await expect(table.getByRole('cell', { name: '+5.4%', exact: true })).toBeVisible();
    await expect(evidence).toContainText('2.4 percentage points');
    await expect(evidence).toContainText('October 11, 2026 snapshot');
    await expect(page.locator('#data-sources')).toContainText('2015–2019 with 2020–2024');
    await expect(evidence.getByRole('link', { name: /Population table/ })).toBeVisible();
    await expect(evidence.getByRole('link', { name: /Income table/ })).toBeVisible();
    await expect(evidence).not.toContainText('660 kWh');
    await noOverflow(page);
    await accessible(page);

    await tax.click();
    await expect(feature.getByRole('button', { pressed: true })).toHaveText('Property taxes');
    await expect(evidence).not.toHaveAttribute('open');
    await expect(announcement).toContainText('57.1% of the $420 increase and rose by $240.');
    await expect(fullTax).toBeVisible();
    await expect(feature.getByRole('figure', { name: 'What went up' })).toBeVisible();
  }
});

test('primary action opens property-tax findings and the secondary discovery link offers both bill examples', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Try a Free Example', exact: true }).click();
  await expect(page).toHaveURL(origin + '/#business');
  await page.getByRole('link', { name: 'Explore the property-tax example' }).click();
  await expect(page).toHaveURL(origin + '/discover/?example=tax');
  await expect(page.locator('.finding')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Your total rose by $420.00.', exact: true })).toBeVisible();
  await page.locator('.finding summary').first().click();
  await expect(page.getByRole('table')).toContainText('4200.00');
  await expect(page.getByRole('table')).toContainText('4620.00');
  await page.goto('/');
  await page.getByRole('link', { name: /Understand Your Bills/ }).click();
  await expect(page).toHaveURL(origin + '/discover/');
  await page.getByRole('button', { name: 'Try electricity example', exact: true }).click();
  await expect(page.locator('.finding')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'Your total rose by $25.20.', exact: true })).toBeVisible();
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
  await page.getByRole('button', { name: 'Compare cities' }).click();
  await page.getByRole('link', { name: 'Data Sources', exact: true }).click();
  await expect(page.locator('#data-sources')).toBeVisible();
  await expect(page.locator('#data-sources').getByRole('link', { name: 'U.S. Census ACS' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'View the Full Sample Report' })).toHaveAttribute('href', '/sample-report');
  const paths = await page.locator('a[href^="/"]').evaluateAll(links => [...new Set(links.map(link => link.getAttribute('href')))]);
  for (const path of paths) expect((await request.get(path)).status(), path).toBe(200);
  const reports = page.getByRole('region', { name: 'Decision Reports' });
  await expect(reports.getByRole('link', { name: 'View a Sample Report' })).toHaveAttribute('href', '/sample-report');
  const footer = page.getByRole('contentinfo');
  await expect(footer.getByRole('link', { name: 'Pricing (sign-in required)' })).toHaveAttribute('href', '/app/pricing');
  await expect(footer.getByRole('link', { name: 'Terms', exact: true })).toHaveAttribute('href', '/terms-of-conduct');
  await expect(footer.getByRole('link', { name: 'Privacy', exact: true })).toHaveAttribute('href', '/privacy-policy');
});

test('keyboard opens the compact menu, Escape restores focus, and text spacing preserves actions', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const menu = page.locator('.mobile-navigation');
  const summary = menu.locator('summary');
  const header = page.getByRole('banner');
  await page.getByRole('link', { name: 'Skip to content', exact: true }).focus();
  await page.keyboard.press('Tab');
  await expect(header.getByRole('link', { name: 'ifYouMind home', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(summary).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(menu).toHaveAttribute('open', '');
  await page.keyboard.press('Tab');
  await expect(menu.getByRole('link', { name: 'Examples' })).toBeFocused();
  await expect(menu.getByRole('link', { name: 'Decision Reports' })).toHaveAttribute('href', '#reports');
  await expect(menu.getByRole('link', { name: 'Get Started' })).toHaveAttribute('href', '/register');
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
  const selected = page.locator('.question-option[aria-pressed="true"]');
  expect(await selected.evaluate(node => getComputedStyle(node).textDecorationLine)).toContain('underline');
  await selected.focus();
  expect(await selected.evaluate(node => getComputedStyle(node).outlineStyle)).toBe('solid');
  await page.locator('.home-evidence summary').click();
  await noOverflow(page);
});
