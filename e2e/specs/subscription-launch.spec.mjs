import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, callable } from '../support/fixtures.mjs';

for (const [offer, plan, allowance] of [['starter', 'Starter', 1], ['plus', 'Plus', 3]]) {
  test(`${plan} checkout, payment confirmation, report credit and cancellation`, async ({ page, fixtures }) => {
    const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
    const projectId = user.projectIds[0];
    const resultPath = '/app/result/'+projectId;
    const checkoutRequests = [];
    const generationRequests = [];
    let remaining = 0;
    let generated = false;
    let linked = false;
    let cancelAt = null;

    await page.route('**/getCommercialStatus', async route => {
      const body = await (await route.fetch()).json();
      await route.fulfill({ json: { result: { ...body.result, subscriptionOffers:true,
        subscription:linked ? { offer, linked:true, pending:false, state:'active', remaining,
          paidThrough:Math.floor(Date.now()/1000)+86400, cancelAt } : null,
        subscriptionPortalAvailable:linked } } });
    });
    const sample = (await callable('getSampleDecisionReport', {})).result;
    await page.route('**/getMarketIntelligenceProject', async route => {
      const base = (await (await route.fetch()).json()).result;
      const result = generated
        ? { ...sample, id:projectId, sample:false, decisionReportAccess:'pro', decisionReportPurchased:false, decisionReportGenerationRequired:false }
        : { ...base, decisionReportGenerationRequired:true };
      await route.fulfill({ json:{ result } });
    });
    await page.route('**/createCommercialCheckout', route => {
      checkoutRequests.push(route.request().postDataJSON().data);
      return route.fulfill({ json:{result:{url:'https://checkout.stripe.com/c/pay/qa-subscription'}} });
    });
    await page.route('https://checkout.stripe.com/**', route => route.fulfill({
      contentType:'text/html', body:'<!doctype html><title>Sandbox stub</title><h1>Checkout return fixture</h1>',
    }));
    await page.route('**/generatePaidDecisionReport', route => {
      generationRequests.push(route.request().postDataJSON().data);
      generated = true;
      remaining -= 1;
      return route.fulfill({ json:{result:{ready:true}} });
    });

    await signInThroughUi(page, user, '/login?returnUrl='+encodeURIComponent(resultPath));
    await expect(page.getByRole('heading',{ name:'What the full Decision Report adds' })).toBeVisible();
    await page.getByRole('link',{name:'Choose a monthly plan'}).click();
    const plans = page.getByRole('region',{name:'Monthly subscriptions'});
    await expect(plans).toContainText('$4.99/month');
    await expect(plans).toContainText('$9.99/month');
    await expect(plans).toContainText('Unused credits expire');
    await expect(plans).toContainText('Cancel in Account before renewal');
    await expect(page.getByRole('button',{name:'Buy Decision Report'})).toBeVisible();
    const oneTime = page.getByRole('article').filter({ has: page.getByRole('heading', { name: 'One-time Decision Report' }) });
    await expect(oneTime).toContainText('$79');
    await expect(oneTime).toContainText('one time');
    await expect(page.getByText('$3.99',{exact:true})).toHaveCount(0);
    await expect(page.getByRole('button',{name:'Get Pro access'})).toHaveCount(0);
    await page.setViewportSize({width:320,height:568});
    await expectNoHorizontalScroll(page);
    await expectNoHorizontalScroll(page);
    const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
    expect(axe.violations.map(v=>v.id)).toEqual([]);

    await page.getByRole('button',{name:`Choose ${plan}`,exact:true}).click();
    await expect(page).toHaveURL('https://checkout.stripe.com/c/pay/qa-subscription');
    expect(checkoutRequests).toEqual([{organizationId:user.organizationId,offer,projectId}]);

    await page.goto('/app/pricing?checkout=cancelled&projectId='+projectId);
    await expect(page.getByRole('status')).toContainText('Checkout was cancelled');
    await expect(page.getByRole('link',{name:'Back to your decision'})).toHaveAttribute('href',resultPath);
    expect(generationRequests).toEqual([]);
    await page.goto(resultPath+'?subscription=confirming');
    await expect(page.getByText('Your report credit appears after Stripe confirms payment.')).toBeVisible();
    await expect(page.getByRole('button',{name:'Generate full Decision Report'})).toHaveCount(0);
    linked = true;
    remaining = allowance;
    await page.getByRole('button',{name:'Check payment status'}).click();
    await page.getByRole('button',{name:'Generate full Decision Report'}).click();
    await expect(page.getByText('Full report unlocked',{exact:true})).toBeVisible();
    await expect(page.getByRole('button',{name:'Print / save PDF'})).toBeVisible();
    expect(generationRequests).toEqual([{organizationId:user.organizationId,projectId}]);
    cancelAt = Math.floor(Date.now()/1000)+86400;
    await page.goto('/app/account');
    await expect(page.getByRole('heading',{name:plan,exact:true})).toBeVisible();
    await expect(page.getByText(`${allowance-1} full report credits available.`, { exact:false })).toBeVisible();
    await expect(page.getByText(/Cancellation scheduled/)).toBeVisible();
    await expect(page.getByRole('button',{name:'Manage billing'})).toBeVisible();
    await expectNoHorizontalScroll(page);
    await page.goto(resultPath);
    await expect(page.getByText('Full report unlocked',{exact:true})).toBeVisible();
  });
}

test('Account explains the Stripe handoff and recovers from an unavailable portal', async ({ page, fixtures, consoleErrors }) => {
  consoleErrors.allow.push(/status of 503/);
  const user = await fixtures(FIXTURES.VERIFIED);
  let attempts = 0;
  await page.route('**/getCommercialStatus', async route => {
    const body = await (await route.fetch()).json();
    await route.fulfill({ json: { result: { ...body.result, subscriptionPortalAvailable: true,
      subscription: { offer: 'plus', linked: true, state: 'past_due', remaining: 0, paidThrough: 1796083200 } } } });
  });
  await page.route('**/createBillingPortalSession', async route => {
    expect(route.request().postDataJSON().data).toEqual({ organizationId: user.organizationId });
    if (++attempts === 1) {
      await route.fulfill({ status: 503, json: { error: { status: 'UNAVAILABLE', message: 'Billing is temporarily unavailable.' } } });
      return;
    }
    await route.fulfill({ json: { result: { url: 'https://billing.stripe.com/p/session/qa-return-contract' } } });
  });
  await page.route('https://billing.stripe.com/**', route => route.fulfill({
    status: 303, headers: { location: new URL('/app/account', page.url()).href },
  }));
  await signInThroughUi(page, user, '/login?returnUrl=%2Fapp%2Faccount');
  const billing = page.getByRole('button', { name: 'Manage billing' });
  await expect(billing).toHaveAccessibleDescription(/Billing opens in Stripe/);
  await expect(page.getByText(/Payment needs attention/)).toBeVisible();
  await billing.click();
  await expect(page.getByRole('alert')).toHaveText('Billing is temporarily unavailable.');
  const handoff = page.waitForRequest('https://billing.stripe.com/p/session/qa-return-contract');
  const accountReturn = page.waitForResponse(response =>
    response.request().isNavigationRequest() && new URL(response.url()).pathname === '/app/account');
  await billing.click();
  await handoff;
  expect((await accountReturn).status()).toBe(200);
  await expect(page).toHaveURL(/\/app\/account$/);
  await expect(billing).toBeVisible();
  expect(attempts).toBe(2);
});

test('legacy Pro stays manageable in Account with its existing allowance', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.VERIFIED);
  await page.route('**/getCommercialStatus', async route => {
    const body = await (await route.fetch()).json();
    await route.fulfill({ json: { result: { ...body.result, plan: 'pro', planName: 'Pro',
      includedReportsPerMonth: 5, remainingIncludedReports: 4, marketProjectsPerMonth: 50 } } });
  });
  await signInThroughUi(page, user, '/login?returnUrl=%2Fapp%2Fpricing');
  await expect(page.getByText('Legacy Pro · $39/month')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Monthly subscriptions' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Get Pro access' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Manage your plan in Account' }).click();
  await expect(page.getByRole('heading', { name: 'Legacy Pro' })).toBeVisible();
  await expect(page.getByText(/50 decisions and 5 full reports each month/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manage billing' })).toBeVisible();
});
