import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, callable } from '../support/fixtures.mjs';

async function offersAndAccessibility(page, info, state) {
  const monthly = page.getByRole('region', { name: 'Monthly subscriptions' });
  const alternatives = page.getByRole('region', { name: 'Start free, or pay once' });
  for (const [name, price, allowance] of [['Starter', '$4.99/month', '1 full Decision Report'], ['Plus', '$9.99/month', '3 full Decision Reports']]) {
    const offer = monthly.getByRole('article').filter({ has: page.getByRole('heading', { name, exact: true }) });
    await expect(offer).toContainText(price);
    await expect(offer).toContainText(allowance + ' per paid billing period');
    await expect(offer.getByRole('button', { name: name + ' enrollment currently unavailable' })).toBeDisabled();
  }
  await expect(monthly).toContainText('Unused credits expire');
  await expect(monthly).toContainText('Cancel in Account before renewal');
  await expect(alternatives.getByRole('article').filter({ has: page.getByRole('heading', { name: 'Free', exact: true }) })).toContainText('$0');
  await expect(alternatives.getByRole('article').filter({ has: page.getByRole('heading', { name: 'One-time Decision Report' }) })).toContainText('$79');
  await expect(page.getByText('Bill files stay in your browser.', { exact: false })).toBeVisible();
  await expect(page.getByText(/Paid reports use public city and market evidence/)).toBeVisible();
  await expect(page.getByRole('button', { name: /^Choose (Starter|Plus)$/ })).toHaveCount(0);
  for (const [width, height] of info.project.name === 'mobile' ? [[390, 844], [320, 700]] : [[1440, 1000], [820, 1180]]) {
    await page.setViewportSize({ width, height });
    await expectNoHorizontalScroll(page);
    const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(axe.violations.map(v => `${v.id}: ${v.nodes.length}`)).toEqual([]);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: info.outputPath(`pricing-${state}-${width}.jpg`), type: 'jpeg', quality: 85, fullPage: true, scale: 'css', style: '.firebase-emulator-warning { display: none !important; }' });
  }
}

test('public pricing exposes every offer before signup and keeps closed enrollment inert', async ({ page }, info) => {
  const privateCalls = [];
  page.on('request', request => { if (/getMyIntelligenceOrganization|getCommercialStatus|getMarketIntelligenceProject|createCommercialCheckout|requestCommercialAccess/.test(request.url())) privateCalls.push(request.url()); });
  await page.goto('/pricing?offer=plus&checkout=success&projectId=private-marker');
  await expect(page.getByRole('heading', { name: 'Start free. Go further.' })).toBeVisible();
  await offersAndAccessibility(page, info, 'public');
  await expect(page.getByRole('link', { name: 'Try a free example', exact: true })).toHaveAttribute('href', '/discover/?example=tax');
  await expect(page.getByRole('link', { name: 'View a sample report' })).toHaveAttribute('href', '/sample-report');
  await expect(page.getByRole('button', { name: 'Buy Decision Report' })).toHaveCount(0);
  await expect(page.locator('main')).not.toContainText('private-marker');
  await expect(page.locator('main')).not.toContainText('Your payment is complete');
  // Disabled monthly controls cannot receive keyboard focus or initiate a callable.
  await page.getByRole('link', { name: 'Try a free example', exact: true }).focus();
  await expect(page.getByRole('link', { name: 'Try a free example', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'One-time report · $79', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'View a sample report' })).toBeFocused();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Plus enrollment currently unavailable' })).toBeDisabled();
  expect(privateCalls).toEqual([]);
});

test('signed-in Free retains decision continuity and backend denies monthly enrollment', async ({ page, fixtures }, info) => {
  const viewer = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const checkoutCalls = [];
  page.on('request', request => { if (request.url().includes('createCommercialCheckout')) checkoutCalls.push(request.url()); });
  await signInThroughUi(page, viewer, '/login?returnUrl=' + encodeURIComponent('/pricing?projectId=' + viewer.projectIds[0]));
  await expect(page.getByRole('button', { name: 'Buy Decision Report' })).toBeVisible();
  await offersAndAccessibility(page, info, 'free');
  await expect(page.getByRole('link', { name: 'Back to your decision' })).toHaveAttribute('href', '/decisions/' + viewer.projectIds[0]);
  expect(checkoutCalls).toEqual([]);
  // Genuine local callable denial, before Stripe access. No provider session or invoice is created.
  for (const offer of ['starter', 'plus']) {
    const result = await callable('createCommercialCheckout', { organizationId: viewer.organizationId, offer, projectId: viewer.projectIds[0] }, viewer.idToken);
    expect(result.error).toBe('FAILED_PRECONDITION');
    expect(result.message).toBe('Subscription enrollment is currently closed.');
  }
});

for (const offer of ['starter', 'plus']) {
  test(`existing ${offer} subscriber keeps plan management and no replacement purchase CTA`, async ({ page, fixtures }, info) => {
    const viewer = await fixtures(FIXTURES.VERIFIED);
    // Presentation fixture only: no actual billing/entitlement write.
    await page.route('**/getCommercialStatus', async route => {
      const { result } = await (await route.fetch()).json();
      await route.fulfill({ json: { result: { ...result, subscriptionOffers: false, subscriptionPortalAvailable: true,
        subscription: { offer, linked: true, pending: false, state: 'active', remaining: offer === 'starter' ? 1 : 3, paidThrough: 1796083200, cancelAt: null } } } });
    });
    await signInThroughUi(page, viewer, '/login?returnUrl=%2Fpricing');
    await expect(page.getByText(/View your remaining credits and manage your subscription/)).toBeVisible();
    await offersAndAccessibility(page, info, offer);
    await page.getByRole('link', { name: 'Account', exact: true }).last().click();
    await expect(page.getByRole('heading', { name: offer === 'starter' ? 'Starter' : 'Plus', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Manage billing' })).toBeVisible();
  });
}

test('legacy Pro retains its existing price, allowance and Account route', async ({ page, fixtures }, info) => {
  const viewer = await fixtures(FIXTURES.VERIFIED);
  await page.route('**/getCommercialStatus', async route => {
    const { result } = await (await route.fetch()).json();
    await route.fulfill({ json: { result: { ...result, plan: 'pro', planName: 'Pro', includedReportsPerMonth: 5, remainingIncludedReports: 4, marketProjectsPerMonth: 50 } } });
  });
  await signInThroughUi(page, viewer, '/login?returnUrl=%2Fpricing');
  await expect(page.getByText('Legacy Pro · $39/month')).toBeVisible();
  await offersAndAccessibility(page, info, 'legacy');
  await page.getByRole('link', { name: 'Manage your plan in Account' }).click();
  await expect(page.getByRole('heading', { name: 'Legacy Pro', exact: true })).toBeVisible();
  await expect(page.getByText(/50 decisions and 5 full reports each month/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manage billing' })).toBeVisible();
});
