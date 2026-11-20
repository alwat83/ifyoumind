// The public sample report shows its analytical answer within the first screen on phones, and the
// desktop layout keeps its top bar, notice and contents unchanged.
import { test, expect, expectAccessible } from '../support/test.mjs';
import { seedSampleReport } from '../support/fixtures.mjs';

test.beforeAll(async () => { await seedSampleReport(); });

test('sample report: the answer starts on the first screen, with nothing removed', async ({ page }, testInfo) => {
  await page.goto('/sample-report');
  const headline = page.locator('#recommendation h2');
  await expect(headline).toContainText('Austin, TX has higher median household income');
  const viewport = page.viewportSize();
  const top = (await headline.boundingBox()).y;
  if (testInfo.project.name === 'mobile') {
    // At least the first lines of the answer are on the first screen.
    expect(top, `headline top ${Math.round(top)}px, viewport ${viewport.height}px`).toBeLessThan(viewport.height - 80);
  }

  // One common header; the optional account/report continuation follows the sample.
  const topBar = page.locator('app-journey-navigation');
  await expect(topBar.getByRole('link', { name: 'ifYouMind home' })).toBeVisible();
  const offer = page.locator('.report-offer');
  await expect(offer.getByRole('link', { name: 'Start free', exact: true })).toBeAttached();
  await expect(offer.getByRole('link', { name: /Get this report for your cities · \$79/ })).toBeAttached();
  await expect(page.locator('.sample-intro')).toContainText('This is a sample report.');
  await expect(page.locator('.sample-intro')).toContainText('a free brief covers your main city and one comparison');
  const contents = page.getByRole('navigation', { name: 'In this report' });
  await expect(contents.getByRole('link')).toHaveCount(7);
  await expect(contents.getByRole('link', { name: 'What the figures show' })).toBeAttached();
  await expect(contents.getByRole('link', { name: 'Sources' })).toBeAttached();

  // No sideways page scroll; the contents row scrolls inside itself on phones.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  if (testInfo.project.name === 'desktop') {
    // Desktop unchanged: contents label visible and the links wrap rather than scroll.
    await expect(contents.locator('.eyebrow')).toBeVisible();
    expect(await contents.locator('ul').evaluate(el => getComputedStyle(el).flexWrap)).toBe('wrap');
  }

  await expectAccessible(page);
  const sources = contents.getByRole('link', { name: 'Sources', exact: true });
  await sources.focus();
  await expect(sources).toBeFocused();
  await expect(sources).toBeInViewport();
  await page.keyboard.press('Enter');
  await expect(page.locator('#sources')).toBeInViewport();
  await expect(page.locator('#sources a').first()).toHaveAttribute('href', /^https:\/\//);
  await offer.getByRole('link', { name: /Get this report for your cities/ }).click();
  await expect(page).toHaveURL(/\/register\?intent=report$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
});
