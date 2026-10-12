const { test } = require('node:test');
const assert = require('node:assert/strict');
const { isAllowedEvent, eventContext, cleanContext, EVENT_CONTEXT } = require('../lib/intelligence/product-event-logic');
const { repeatDecisionOrganizations } = require('../lib/intelligence/growth-metrics');

test('only known events are accepted', () => {
  for (const e of ['app_open', 'decision_created', 'finding_viewed', 'offer_viewed', 'intent_prompt_shown', 'intent_prompt_clicked', 'report_copied', 'report_exported']) assert.equal(isAllowedEvent(e), true, e);
  for (const e of ['', 'second_decision', 'purchase', 'toString', '__proto__', 'constructor', null, 7, 'FINDING_VIEWED']) assert.equal(isAllowedEvent(e), false, String(e));
});

test('new events keep only their schema keys, with values that match', () => {
  assert.deepEqual(eventContext('finding_viewed', { trigger: 'copy', project: 'p_1', email: 'a@b.com', city: 'Austin' }), { trigger: 'copy', project: 'p_1' });
  assert.deepEqual(eventContext('finding_viewed', { trigger: 'scrolled-a-lot', project: 'has space' }), {});
  assert.deepEqual(eventContext('offer_viewed', { surface: 'upgrade_panel', offer: 'report', project: 'p1' }), { surface: 'upgrade_panel', offer: 'report', project: 'p1' });
  assert.deepEqual(eventContext('offer_viewed', { surface: 'upgrade_panel', offer: 'pro' }), { surface: 'upgrade_panel' });
  assert.deepEqual(eventContext('report_exported', { format: 'print', project: 'x'.repeat(65) }), { format: 'print' });
  assert.deepEqual(eventContext('intent_prompt_clicked', ['project', 'p1']), {});
  assert.deepEqual(eventContext('report_copied', null), {});
});

test('no new event schema can carry free text or personal data', () => {
  for (const [event, schema] of Object.entries(EVENT_CONTEXT)) {
    if (!schema) continue;
    for (const [key, pattern] of Object.entries(schema)) {
      for (const bad of ['a@b.com', 'Jane Smith', '123 Main St', 'https://x.example', '<script>']) assert.equal(pattern.test(bad), false, `${event}.${key} accepted ${bad}`);
    }
  }
});

test('established events keep the general rules and now drop email-like values', () => {
  assert.deepEqual(cleanContext({ offer: 'report', paid: 'no' }), { offer: 'report', paid: 'no' });
  assert.deepEqual(cleanContext({ note: 'jane@example.com', offer: 'pro' }), { offer: 'pro' });
  assert.deepEqual(eventContext('pricing_view', { offer: 'report', 'bad key!': 'x', n: 5 }), { offer: 'report' });
});

test('repeat use is derived from decision_created per workspace', () => {
  const ev = (event, organizationId) => ({ event, organizationId });
  assert.equal(repeatDecisionOrganizations([ev('decision_created', 'a'), ev('decision_created', 'a'), ev('decision_created', 'b'), ev('report_view', 'b'), ev('decision_created', 'c'), ev('decision_created', 'c'), ev('decision_created', 'c'), { event: 'decision_created' }]), 2);
  assert.equal(repeatDecisionOrganizations([]), 0);
});
