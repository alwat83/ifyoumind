import { test, expect, expectAccessible, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES } from '../support/fixtures.mjs';

test('Midnight Slate remains dark across public and private journeys even with a light system preference', async ({ page, fixtures }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  for (const path of ['/', '/pricing', '/register', '/login', '/discover/', '/privacy-policy', '/terms-of-conduct', '/guides/']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(9, 13, 23)');
    await expectNoHorizontalScroll(page);
  }
  const viewer = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await signInThroughUi(page, viewer);
  for (const path of ['/decisions', '/decide', '/account', '/pricing', `/decisions/${viewer.projectIds[0]}`]) {
    await page.goto(path);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(9, 13, 23)');
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);
  }
});

test('returning readers see their saved question before suggestions and can reopen it', async ({ page, fixtures }) => {
  const viewer = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  await signInThroughUi(page, viewer);
  const saved = page.locator('.recent-grid a').first();
  await expect(saved).toContainText('where should the bakery open?');
  const savedTop = (await saved.boundingBox()).y;
  const suggestedTop = (await page.getByRole('region', { name: 'Ways to explore' }).boundingBox()).y;
  expect(savedTop).toBeLessThan(suggestedTop);
  await saved.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(new RegExp(`/decisions/${viewer.projectIds[0]}$`));
  await expect(page.locator('#recommendation')).toBeVisible();
});

test('the report leads with its answer and keeps sample detail inspectable', async ({ page }) => {
  await page.goto('/sample-report');
  const answer = page.locator('#recommendation');
  await expect(answer).toBeVisible();
  const contents = page.getByRole('navigation', { name: 'In this report' });
  expect((await answer.boundingBox()).y).toBeLessThan((await contents.boundingBox()).y);
  const disclosure = page.locator('.sample-intro details');
  await expect(disclosure).not.toHaveAttribute('open');
  await disclosure.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(disclosure).toHaveAttribute('open', '');
  await expect(disclosure).toContainText('a free brief covers your main city and one comparison');
  await expectAccessible(page);
});
