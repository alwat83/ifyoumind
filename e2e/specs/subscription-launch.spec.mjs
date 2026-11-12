import AxeBuilder from '@axe-core/playwright';
import { test, expect, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { FIXTURES, callable, seedSampleReport } from '../support/fixtures.mjs';

test.beforeAll(seedSampleReport);

test('subscription launch shows terms, keeps the one-time route, and verifies payment before report generation', async ({ page, fixtures }) => {
  const user = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 });
  const projectId = user.projectIds[0];
  const resultPath = '/app/result/'+projectId;
  const checkoutRequests = [];
  const generationRequests = [];
  let remaining = 0;
  let generated = false;
  let linked = false;

  await page.route('**/getCommercialStatus', async route => {
    const body = await (await route.fetch()).json();
    await route.fulfill({ json: { result: { ...body.result, subscriptionOffers:true,
      subscription:linked ? { offer:'starter', linked:true, pending:false, state:'active', remaining,
        paidThrough:Math.floor(Date.now()/1000)+86400, cancelAt:null } : null,
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
    remaining = 0;
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
  await expect(page.getByText('$79',{exact:true})).toBeVisible();
  await expect(page.getByText('$3.99',{exact:true})).toHaveCount(0);
  await expectNoHorizontalScroll(page);
  const axe = await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa']).analyze();
  expect(axe.violations.map(v=>v.id)).toEqual([]);

  await page.getByRole('button',{name:'Choose Starter',exact:true}).click();
  await expect(page).toHaveURL('https://checkout.stripe.com/c/pay/qa-subscription');
  expect(checkoutRequests).toEqual([{organizationId:user.organizationId,offer:'starter',projectId}]);

  await page.goto(resultPath+'?subscription=confirming');
  await expect(page.getByText('Your report credit appears after Stripe confirms payment.')).toBeVisible();
  await expect(page.getByRole('button',{name:'Generate full Decision Report'})).toHaveCount(0);
  linked = true;
  remaining = 1;
  await page.getByRole('button',{name:'Check payment status'}).click();
  await page.getByRole('button',{name:'Generate full Decision Report'}).click();
  await expect(page.getByText('Full report unlocked',{exact:true})).toBeVisible();
  await expect(page.getByRole('button',{name:'Print / save PDF'})).toBeVisible();
  expect(generationRequests).toEqual([{organizationId:user.organizationId,projectId}]);
  await page.goto('/app/account');
  await expect(page.getByRole('heading',{name:'Starter',exact:true})).toBeVisible();
  await expect(page.getByText(/0 full report credits available\./)).toBeVisible();
  await expect(page.getByRole('button',{name:'Manage billing'})).toBeVisible();
  await expectNoHorizontalScroll(page);
});
