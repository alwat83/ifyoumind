const { test } = require('node:test');
const assert = require('node:assert/strict');
const {
  decisionReportAccess,
  allowancePeriod,
  includedReportsUsed,
  proUnlockDecision,
  blocksNewProCheckout,
  blocksReportCheckout,
} = require('../lib/intelligence/report-entitlement-logic');

test('report access distinguishes purchased, Pro-included and locked reports', () => {
  assert.equal(decisionReportAccess({decisionReportPurchased:true}),'purchased');
  assert.equal(decisionReportAccess({decisionReportPurchased:true,decisionReportIncludedWithPro:true}),'purchased');
  assert.equal(decisionReportAccess({decisionReportIncludedWithPro:true}),'pro');
  assert.equal(decisionReportAccess({decisionReportPurchased:'true'}),'none');
  assert.equal(decisionReportAccess({}),'none');
  assert.equal(decisionReportAccess(undefined),'none');
});

test('allowance period is the UTC calendar month', () => {
  assert.equal(allowancePeriod(new Date(Date.UTC(2026,9,31,23,59))),'2026-10');
  assert.equal(allowancePeriod(new Date(Date.UTC(2026,0,1,0,0))),'2026-01');
});

test('included report usage resets when the period changes', () => {
  const org={proReportAllowance:{period:'2026-10',used:3}};
  assert.equal(includedReportsUsed(org,'2026-10'),3);
  assert.equal(includedReportsUsed(org,'2026-11'),0);
  assert.equal(includedReportsUsed({},'2026-10'),0);
  assert.equal(includedReportsUsed({proReportAllowance:{period:'2026-10',used:'bad'}},'2026-10'),0);
});

test('Pro unlock is limited to Pro plans with allowance remaining', () => {
  assert.deepEqual(proUnlockDecision({plan:'pro',access:'none',used:4,limit:5}),{ok:true,alreadyUnlocked:false});
  assert.deepEqual(proUnlockDecision({plan:'pro',access:'none',used:5,limit:5}),{ok:false,reason:'allowance-exhausted'});
  assert.deepEqual(proUnlockDecision({plan:'free',access:'none',used:0,limit:5}),{ok:false,reason:'not-pro'});
});

test('unlocking an already unlocked report never spends allowance', () => {
  assert.deepEqual(proUnlockDecision({plan:'pro',access:'purchased',used:5,limit:5}),{ok:true,alreadyUnlocked:true});
  assert.deepEqual(proUnlockDecision({plan:'free',access:'pro',used:0,limit:5}),{ok:true,alreadyUnlocked:true});
});

test('a second Pro checkout is blocked while a subscription is live', () => {
  assert.equal(blocksNewProCheckout({plan:'pro'}),true);
  for(const status of ['active','trialing','past_due','unpaid','paused']){
    assert.equal(blocksNewProCheckout({plan:'free',stripeSubscriptionStatus:status}),true,status);
  }
  for(const status of ['canceled','incomplete','incomplete_expired',undefined]){
    assert.equal(blocksNewProCheckout({plan:'free',stripeSubscriptionStatus:status}),false,String(status));
  }
  assert.equal(blocksNewProCheckout(undefined),false);
});

test('report checkout is blocked once the report is unlocked', () => {
  assert.equal(blocksReportCheckout({decisionReportPurchased:true}),true);
  assert.equal(blocksReportCheckout({decisionReportIncludedWithPro:true}),true);
  assert.equal(blocksReportCheckout({}),false);
});
