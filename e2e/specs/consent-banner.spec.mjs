// The analytics cookie banner must stay visible until the visitor chooses, but never block the page.
import { test, expect, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

const PHONES = [[320, 568], [360, 740], [390, 844]];
const banner = page => page.getByRole('region', { name: 'Cookie choice' });

/** The element actually under the centre of `locator` is that element (or inside it): nothing covers it. */
async function expectUncovered(locator) {
  await locator.scrollIntoViewIfNeeded();
  const covered = await locator.evaluate(el => {
    const r = el.getBoundingClientRect();
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(top === el || el.contains(top));
  });
  expect(covered, 'element is covered by something else').toBe(false);
}

for (const [width, height] of PHONES) {
  test(`${width}px: banner shows all three choices and the decision button can still be used`, async ({ page, fixtures }) => {
    await page.setViewportSize({ width, height });
    const user = await fixtures(FIXTURES.FREE_NO_REPORTS);
    await signInThroughUi(page, user);
    await expect(page).toHaveURL(/\/app$/);
    await expect(banner(page)).toBeVisible();
    for (const name of ['Allow analytics', 'Reject', 'Manage']) {
      const button = banner(page).getByRole('button', { name });
      await expect(button).toBeInViewport();
    }

    await page.goto('/app/decide?type=business');
    await page.getByLabel(/Main location/).fill('Springfield, IL');
    await page.getByLabel(/Compare with other places/).fill('Madison, WI');
    await expectUncovered(page.getByRole('button', { name: 'Continue' }));
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByLabel(/Your business/).fill('Neighbourhood bakery');
    await page.getByLabel('The question you want answered').fill('Should the bakery open here?');
    const analyse = page.getByRole('button', { name: 'Show me what the data says' });
    await expectUncovered(analyse);
    await analyse.click();
    await expect(page).toHaveURL(/\/app\/result\//);
    // No choice was made, so the banner is still there and nothing was consented to.
    await expect(banner(page)).toBeVisible();
  });

  test(`${width}px: the last thing on the page can be scrolled clear of the banner`, async ({ page }) => {
    await page.setViewportSize({ width, height });
    await page.goto('/');
    await expect(banner(page)).toBeVisible();
    const last = page.locator('footer a, .app-footer a, a').last();
    await expectUncovered(last);
  });
}

test('choosing removes the banner and the space it reserved, and the choice is remembered', async ({ page }) => {
  await page.goto('/');
  await expect(banner(page)).toBeVisible();
  const reserved = await page.evaluate(() => getComputedStyle(document.body).paddingBottom);
  expect(parseFloat(reserved)).toBeGreaterThan(40);
  await banner(page).getByRole('button', { name: 'Reject' }).click();
  await expect(banner(page)).toHaveCount(0);
  expect(await page.evaluate(() => document.body.style.paddingBottom)).toBe('');
  await page.reload();
  await expect(banner(page)).toHaveCount(0);
});
