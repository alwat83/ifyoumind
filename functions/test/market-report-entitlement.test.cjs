const { test } = require('node:test');
const assert = require('node:assert/strict');
const { briefForEntitlement } = require('../lib/intelligence/market-intelligence');

test('free Decision Brief never exposes paid report payload', () => {
  const brief={
    metrics:[{key:'population'}],
    opportunities:['support'],
    decisionReport:{schemaVersion:1,actionPlan:[{title:'paid'}]},
  };
  const result=briefForEntitlement(brief,false);
  assert.equal(result.decisionReport,undefined);
  assert.deepEqual(result.metrics,brief.metrics);
  assert.deepEqual(result.opportunities,brief.opportunities);
});

test('purchased Decision Report preserves paid payload', () => {
  const brief={decisionReport:{schemaVersion:1}};
  assert.equal(briefForEntitlement(brief,true),brief);
});
