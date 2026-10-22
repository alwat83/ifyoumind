import { test, expect } from '../support/test.mjs';

test('initial responses protect private routes and give public routes their own metadata', async ({ request }) => {
  for (const path of ['/', '/sample-report?utm_source=regression', '/privacy-policy', '/terms-of-conduct']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    const canonical = `https://ifyoumind.com${path.split('?')[0]}`;
    expect(html).toContain(`<link rel="canonical" href="${canonical}">`);
    expect(html).toContain('name="robots" content="index,follow"');
    expect((html.match(/application\/ld\+json/g) || []).length).toBe(path === '/' ? 1 : 0);
  }
  for (const path of ['/login', '/register?intent=report', '/verify-email', '/app', '/app/result/private-id']) {
    const response = await request.get(path);
    expect(response.status()).toBe(200);
    const html = await response.text();
    expect(html).toContain('name="robots" content="noindex,nofollow"');
    expect(html).not.toMatch(/rel="canonical"|og:url|application\/ld\+json/);
  }
  const missing = await request.get('/this-route-does-not-exist');
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain('Page not found');
  expect((await request.get('/life/quick-compare')).status()).toBe(404);
  const slash = await request.get('/sample-report/', { maxRedirects: 0 });
  expect(slash.status()).toBe(301);
  expect(slash.headers().location).toBe('/sample-report');
});

test('client navigation removes homepage offers and updates robots and canonical', async ({ page }) => {
  await page.goto('/?utm_source=regression');
  await expect(page).toHaveTitle('ifYouMind — Evidence for clearer decisions');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ifyoumind.com/');
  await expect(page.locator('#page-structured-data')).toHaveCount(1);
  await page.locator('nav.nav').getByRole('link', { name: 'Try it free' }).click();
  await expect(page).toHaveURL(/\/register$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow');
  await expect(page.locator('link[rel="canonical"], script[type="application/ld+json"]')).toHaveCount(0);
  await page.goto('/privacy-policy?utm_source=regression');
  await expect(page).toHaveTitle('Privacy Policy | ifYouMind');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://ifyoumind.com/privacy-policy');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index,follow');
  await expect(page.locator('script[type="application/ld+json"]')).toHaveCount(0);
});
