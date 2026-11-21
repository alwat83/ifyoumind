import { readFileSync } from 'node:fs';
import { test, expect, expectAccessible, expectNoHorizontalScroll } from '../support/test.mjs';

const raw = readFileSync('src/app/intelligence/home-bill-examples.json', 'utf8');
const examples = JSON.parse(raw);

for (const category of ['tax', 'electricity']) {
  test(`the ${category} finding leads directly to its own private CSV input`, async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Reveal what changed', exact: true }).click();
    if (category === 'electricity') await page.getByRole('button', { name: 'Electricity bills', exact: true }).click();
    const question = page.getByRole('heading', { name: category === 'tax' ? 'Why did my property taxes go up?' : 'Did my bill rise faster than my energy use?' });
    await expect(question).toBeVisible();
    await expect(page.locator('#discovery-result')).toContainText(examples[category].highlights[0].value.replace(/^\+|\.00$/g, ''));
    await page.locator('.home-evidence summary').click();
    await expect(page.locator('.home-evidence table').first()).toBeVisible();
    await page.getByRole('link', { name: `Compare my ${category === 'tax' ? 'tax' : 'electricity'} CSV`, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/discover/\\?example=${category}&input=csv$`));
    await expect(page.getByLabel('Choose a redacted CSV', { exact: true })).toBeFocused();
    await expect(page.locator('.finding')).toHaveCount(0);
    await expect(page.locator('.csv')).toContainText('Remove names, addresses');
    await expect(page.locator('.shell-footer')).toContainText('We don’t upload or store them.');
    const requestCount = [];
    page.on('request', req => requestCount.push(req.url()));
    await page.evaluate(() => document.fonts.ready);
    await expectNoHorizontalScroll(page);
    await expectAccessible(page);
    expect(requestCount.filter(url => /openai|googleapis|cloudfunctions|firestore|stripe/i.test(url))).toEqual([]);
  });
}

test('unknown intake modes cannot select files, and navigation retains only the example category', async ({ page }) => {
  await page.goto('/discover/?example=tax&input=unknown&privateAmount=999999');
  await expect(page.locator('.finding')).toHaveCount(3);
  const back = page.getByRole('link', { name: 'Back to examples', exact: true });
  await expect(back).toHaveAttribute('href', '/?example=tax#business');
  await back.click();
  await expect(page).toHaveURL(url => url.search === '?example=tax' && url.hash === '#business');
  await expect(page.locator('#discovery-result')).not.toContainText('999999');
});

for (const category of ['tax', 'electricity']) {
  test(`the ${category} example keeps its context when continuing to a private CSV`, async ({ page }) => {
    await page.goto(`/discover/?example=${category}`);
    await expect(page.locator('.finding').first()).toBeVisible();
    await page.getByRole('button', { name: 'Compare my redacted CSV', exact: true }).click();
    await expect(page.getByLabel('Choose a redacted CSV', { exact: true })).toBeFocused();
    await expect(page).toHaveURL(new RegExp(`/discover/\\?example=${category}$`));
    const navigation = page.locator('app-journey-navigation');
    const menu = navigation.locator('.mobile-navigation');
    if (await menu.isVisible()) await menu.locator('summary').click();
    await expect(navigation.getByRole('link', { name: 'Explore examples', exact: true })).toHaveAttribute('href', `/?example=${category}#business`);
  });
}
