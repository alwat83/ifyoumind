const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createHmac } = require('node:crypto');
const {
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
