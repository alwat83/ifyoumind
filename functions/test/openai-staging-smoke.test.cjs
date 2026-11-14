const assert = require('node:assert/strict');
const test = require('node:test');
const { renderExplanation } = require('../lib/intelligence/openai-explanation.js');
const smokeModule = import('../../scripts/openai-staging-smoke.mjs');
const project = 'fixture-staging';
const tokenFor = aud => {
  const claims = Buffer.from(JSON.stringify({ aud, iss: `https://securetoken.google.com/${aud}` })).toString('base64url');
  return `header.${claims}.signature`;
};
const args = { approved: true, phase: 'enabled', project, organizationId: 'synthetic-fixture', token: tokenFor(project) };
const usage = { inputTokens: 250, outputTokens: 8, serviceTier: 'default' };
const enabled = { ...renderExplanation('income', 'openai'), usage };
const disabled = { ...renderExplanation('households', 'deterministic'), reason: 'disabled' };
const reply = result => async () => Response.json({ result });

test('smoke records verified generation usage and full request latency from one Firebase call', async () => {
  const { runStagingSmoke } = await smokeModule;
  let calls = 0;
  const result = await runStagingSmoke(args, async (url, options) => {
    calls++;
    assert.equal(url, 'https://us-central1-fixture-staging.cloudfunctions.net/explainSyntheticMarket');
    assert.equal(options.method, 'POST');
    assert.equal(options.redirect, 'error');
    assert.deepEqual(JSON.parse(options.body), { data: { organizationId: args.organizationId, useProvider: true } });
    assert.equal(options.headers.authorization, `Bearer ${args.token}`);
    return Response.json({ result: enabled });
  });
  const { latencyMs, ...observations } = result;
  assert.ok(Number.isInteger(latencyMs) && latencyMs >= 0);
  assert.deepEqual(observations, { phase: 'enabled', source: 'openai', valid: true, ...usage });
  assert.equal(calls, 1);
});

test('both flag-off phases confirm the deterministic explanation without exposing response material', async () => {
  const { runStagingSmoke } = await smokeModule;
  for (const phase of ['disabled-before', 'disabled-after']) {
    const { latencyMs, ...observations } = await runStagingSmoke({ ...args, phase }, async (_url, options) => {
      assert.deepEqual(JSON.parse(options.body), { data: { organizationId: args.organizationId } });
      return Response.json({ result: disabled });
    });
    assert.ok(latencyMs >= 0);
    assert.deepEqual(observations, { phase, source: 'deterministic', valid: true });
    await assert.rejects(runStagingSmoke({ ...args, phase }, reply(enabled)), /disabled fallback/);
    await assert.rejects(runStagingSmoke({ ...args, phase }, reply({ ...disabled, reason: 'not-requested' })), /disabled fallback/);
  }
});

test('smoke fails before network access without explicit approval, a staging target and a matching token', async () => {
  const { runStagingSmoke } = await smokeModule;
  const unreachable = () => assert.fail('unexpected network request');
  for (const override of [
    { approved: false }, { project: 'ifyoumind-473fe' }, { project: 'demo-ifyoumind' },
    { project: 'bad.example.com' }, { token: tokenFor('other-project') }, { organizationId: 'real-workspace' },
    { phase: 'other' }, { token: 'not-a-firebase-id-token' },
  ]) await assert.rejects(runStagingSmoke({ ...args, ...override }, unreachable), /staging/);
});

test('smoke rejects invented facts, unverified usage, fallback in the enabled phase and HTTP errors', async () => {
  const { runStagingSmoke } = await smokeModule;
  for (const result of [
    { ...enabled, synthetic: false }, { ...enabled, evidence: [enabled.evidence[0], enabled.evidence[0]] },
    { ...enabled, evidence: [{ ...enabled.evidence[0], statement: 'Invented finding' }, enabled.evidence[1]] },
    { ...enabled, usage: { ...usage, inputTokens: 769 } }, { ...enabled, usage: { ...usage, outputTokens: 0 } },
    { ...enabled, usage: { ...usage, serviceTier: 'priority' } }, disabled,
  ]) await assert.rejects(runStagingSmoke(args, reply(result)), /did not/);
  await assert.rejects(runStagingSmoke(args, async () => new Response(null, { status: 403 })), /rejected/);
});
