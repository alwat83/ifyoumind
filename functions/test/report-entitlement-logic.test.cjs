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

const { decisionView, freeBriefComparisonCount, REPORT_COMPARISON_LIMIT } = require('../lib/intelligence/report-entitlement-logic');

test('free decisions with more than one comparison keep a one-comparison free brief', () => {
  assert.equal(REPORT_COMPARISON_LIMIT, 3);
  assert.equal(freeBriefComparisonCount('free', 3), 1);
  assert.equal(freeBriefComparisonCount('free', 1), null);
  assert.equal(freeBriefComparisonCount('free', 0), null);
  assert.equal(freeBriefComparisonCount('pro', 3), null);
});

test('decision view shows the free brief until the report is unlocked', () => {
  const project = {
    brief: { comparisons: ['b', 'c', 'd'] },
    freeBrief: { comparisons: ['b'] },
    freeComparisonCount: 1,
    comparisonLocations: ['B', 'C', 'D'],
  };
  const locked = decisionView(project, 'none');
  assert.deepEqual(locked.brief, project.freeBrief);
  assert.deepEqual(locked.comparisonLocations, ['B']);
  assert.deepEqual(locked.reportOnlyLocations, ['C', 'D']);
  for (const access of ['purchased', 'pro']) {
    const full = decisionView(project, access);
    assert.deepEqual(full.brief, project.brief);
    assert.deepEqual(full.comparisonLocations, ['B', 'C', 'D']);
    assert.deepEqual(full.reportOnlyLocations, []);
  }
});

test('decisions without a free brief (Pro, single comparison, older decisions) are unchanged', () => {
  const project = { brief: { comparisons: ['b'] }, comparisonLocations: ['B'] };
  const view = decisionView(project, 'none');
  assert.deepEqual(view.brief, project.brief);
  assert.deepEqual(view.comparisonLocations, ['B']);
  assert.deepEqual(view.reportOnlyLocations, []);
});

const { FREE_DECISIONS_PER_MONTH, freeDecisionPeriodStart, freeDecisionLimitReached } = require('../lib/intelligence/report-entitlement-logic');

test('free decisions: three a month, counted from the 1st at 00:00 UTC', () => {
  assert.equal(FREE_DECISIONS_PER_MONTH, 3);
  assert.equal(freeDecisionPeriodStart(new Date('2026-10-31T23:59:59Z')).toISOString(), '2026-10-01T00:00:00.000Z');
  assert.equal(freeDecisionPeriodStart(new Date('2026-11-01T00:00:00Z')).toISOString(), '2026-11-01T00:00:00.000Z');
  assert.equal(freeDecisionPeriodStart(new Date('2027-01-01T00:30:00+05:00')).toISOString(), '2026-12-01T00:00:00.000Z', 'UTC, not local time');
  assert.equal(freeDecisionLimitReached('free', 2), false);
  assert.equal(freeDecisionLimitReached('free', 3), true);
  assert.equal(freeDecisionLimitReached(undefined, 3), true, 'a missing plan is free');
  assert.equal(freeDecisionLimitReached('pro', 300), false);
});

const { PRO_DECISIONS_PER_MONTH, decisionLimitFor, reserveDecision, releaseDecision, decisionLimitMessage } = require('../lib/intelligence/report-entitlement-logic');

test('decision allowance: 3 free and 50 Pro per UTC month, reserved before work starts', () => {
  assert.equal(decisionLimitFor('free'), 3);
  assert.equal(decisionLimitFor(undefined), 3);
  assert.equal(decisionLimitFor('pro'), PRO_DECISIONS_PER_MONTH);
  assert.equal(PRO_DECISIONS_PER_MONTH, 50);
  assert.deepEqual(reserveDecision(undefined, '2026-10', 0, 3), { ok: true, next: { period: '2026-10', used: 1 } });
  assert.deepEqual(reserveDecision({ period: '2026-10', used: 2 }, '2026-10', 1, 3), { ok: true, next: { period: '2026-10', used: 3 } }, 'in-flight reservations count');
  assert.deepEqual(reserveDecision({ period: '2026-10', used: 3 }, '2026-10', 3, 3), { ok: false, used: 3 });
  assert.deepEqual(reserveDecision({ period: '2026-09', used: 50 }, '2026-10', 0, 50), { ok: true, next: { period: '2026-10', used: 1 } }, 'a new month starts at zero');
  assert.deepEqual(reserveDecision({ period: '2026-10', used: 0 }, '2026-10', 49, 50), { ok: true, next: { period: '2026-10', used: 50 } }, 'stored decisions heal an old counter');
  assert.deepEqual(reserveDecision({ period: '2026-10', used: 0 }, '2026-10', 50, 50), { ok: false, used: 50 });
  assert.deepEqual(reserveDecision({ period: '2026-10', used: 'x' }, '2026-10', 0, 3), { ok: true, next: { period: '2026-10', used: 1 } });
  assert.deepEqual(releaseDecision({ period: '2026-10', used: 2 }, '2026-10'), { period: '2026-10', used: 1 });
  assert.deepEqual(releaseDecision({ period: '2026-10', used: 0 }, '2026-10'), { period: '2026-10', used: 0 });
  assert.equal(releaseDecision({ period: '2026-09', used: 2 }, '2026-10'), null, 'never touches another month');
  assert.match(decisionLimitMessage('pro'), /50 decisions included with Pro this month.*reset on the 1st \(UTC\).*stay available/);
  assert.match(decisionLimitMessage('free'), /3 free decisions this month/);
});
