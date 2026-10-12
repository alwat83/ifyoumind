const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const {
  subscriptionPrice,
  subscriberPricing,
  portalConfiguration,
  validStripeSignature,
  grantsPro,
  shouldApplySubscriptionEvent,
} = require('../lib/intelligence/stripe-commerce-logic');

test('accepts a valid Stripe signature inside the tolerance window', () => {
  const payload='{"id":"evt_test"}';
  const secret='whsec_test';
  const timestamp=2000;
  const signature=createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  assert.equal(validStripeSignature(payload,`t=${timestamp},v1=${signature}`,secret,2200),true);
});

test('rejects stale and tampered Stripe signatures', () => {
  const payload='{"id":"evt_test"}';
  const secret='whsec_test';
  const timestamp=2000;
  const signature=createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex');
  assert.equal(validStripeSignature(payload,`t=${timestamp},v1=${signature}`,secret,2401),false);
  assert.equal(validStripeSignature(payload+'x',`t=${timestamp},v1=${signature}`,secret,2200),false);
});

test('only active and trialing subscriptions grant Pro', () => {
  assert.equal(grantsPro('active'),true);
  assert.equal(grantsPro('trialing'),true);
  for(const status of ['past_due','unpaid','canceled','incomplete','paused',undefined]){
    assert.equal(grantsPro(status),false);
  }
});

test('subscription events cannot move billing state backwards in time', () => {
  assert.equal(shouldApplySubscriptionEvent(101,100),true);
  assert.equal(shouldApplySubscriptionEvent(100,100),true);
  assert.equal(shouldApplySubscriptionEvent(99,100),false);
  assert.equal(shouldApplySubscriptionEvent(100,undefined),true);
  assert.equal(shouldApplySubscriptionEvent(undefined,100),false);
});

test('detects whether a Stripe key can take real payments', () => {
  const { stripeKeyMode } = require('../lib/intelligence/stripe-commerce-logic');
  assert.equal(stripeKeyMode('sk_live_abc'),'live');
  assert.equal(stripeKeyMode('rk_live_abc'),'live');
  assert.equal(stripeKeyMode('sk_test_abc'),'test');
  assert.equal(stripeKeyMode('rk_test_abc'),'test');
  assert.equal(stripeKeyMode(''),'unknown');
  assert.equal(stripeKeyMode(undefined),'unknown');
});

test('checkout uses the price set that matches the key mode', () => {
  const { stripePriceIds, STRIPE_PRICES } = require('../lib/intelligence/stripe-commerce-logic');
  assert.deepEqual(stripePriceIds('live'),STRIPE_PRICES.live);
  assert.deepEqual(stripePriceIds('test'),STRIPE_PRICES.test);
  assert.deepEqual(stripePriceIds('unknown'),STRIPE_PRICES.test);
  assert.equal(stripePriceIds('live',{pro:' price_override '}).pro,'price_override');
  assert.equal(stripePriceIds('live',{pro:''}).pro,STRIPE_PRICES.live.pro);
});

test('events for another subscription cannot end the current Pro subscription', () => {
  const { subscriptionEventMayChangePlan } = require('../lib/intelligence/stripe-commerce-logic');
  const current={stripeSubscriptionId:'sub_current',stripeSubscriptionStatus:'active'};
  assert.equal(subscriptionEventMayChangePlan(current,'sub_current','canceled'),true);
  assert.equal(subscriptionEventMayChangePlan(current,'sub_duplicate','canceled'),false);
  assert.equal(subscriptionEventMayChangePlan(current,'sub_duplicate','active'),true);
  assert.equal(subscriptionEventMayChangePlan({stripeSubscriptionId:'sub_old',stripeSubscriptionStatus:'canceled'},'sub_new','active'),true);
  assert.equal(subscriptionEventMayChangePlan({},'sub_new','active'),true);
});

test('the billed price is read from the subscription item, falling back to the legacy plan field', () => {
  const sub = { items: { data: [{ price: { id: 'price_a', unit_amount: 3900, currency: 'usd', recurring: { interval: 'month' } } }] } };
  assert.deepEqual(subscriptionPrice(sub), { priceId: 'price_a', unitAmountCents: 3900, currency: 'usd', interval: 'month' });
  assert.deepEqual(subscriptionPrice({ plan: { id: 'price_b', amount: 14900, currency: 'usd', interval: 'month' } }), { priceId: 'price_b', unitAmountCents: 14900, currency: 'usd', interval: 'month' });
  assert.equal(subscriptionPrice({}).unitAmountCents, null);
});

test('grandfathering is detected only when a known monthly USD price is below the list price', () => {
  const org = { stripeSubscriptionUnitAmount: 3900, stripeSubscriptionCurrency: 'usd', stripeSubscriptionInterval: 'month' };
  assert.deepEqual(subscriberPricing(org, 39), { monthlyUsd: 39, grandfathered: false, listMonthlyUsd: 39, cancelAtPeriodEnd: false });
  assert.equal(subscriberPricing(org, 149).grandfathered, true);
  assert.equal(subscriberPricing({ ...org, stripeSubscriptionUnitAmount: 14900 }, 149).grandfathered, false);
  assert.equal(subscriberPricing({}, 149).monthlyUsd, null, 'unknown price is not guessed');
  assert.equal(subscriberPricing({}, 149).grandfathered, false);
  assert.equal(subscriberPricing({ ...org, stripeSubscriptionInterval: 'year' }, 149).monthlyUsd, null);
  assert.equal(subscriberPricing({ ...org, stripeCancelAtPeriodEnd: true }, 39).cancelAtPeriodEnd, true);
});

test('a billing portal configuration is sent only when a valid one is set for the key mode', () => {
  assert.equal(portalConfiguration('live'), null, 'none configured today: Stripe default portal, as before');
  assert.equal(portalConfiguration('live', { live: 'bpc_123', test: '' }), 'bpc_123');
  assert.equal(portalConfiguration('test', { live: 'bpc_123', test: '' }), null);
  assert.equal(portalConfiguration('live', { live: 'not-a-config', test: '' }), null);
});
