import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/app/intelligence/decision-steps.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { billIntent, decisionType, formattedCity, placeKey, sampleCityMatches } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('a local tax question is not routed as a personal bill finding', () => {
  for (const question of [
    'What are the property taxes in Birmingham?',
    'What is the property tax rate in Birmingham, Alabama?',
    'Which city has higher property taxes?',
    'What is the millage in my county?',
    'How did property taxes change in Birmingham?',
    'Compare the property tax rates in Birmingham and Huntsville',
  ]) assert.equal(billIntent(question), 'local-tax', question);
});

test('statement changes, property-specific checks and utility tariffs require different evidence', () => {
  assert.equal(billIntent('Why did my property taxes go up?'), 'tax-bill');
  assert.equal(billIntent('What changed on my electric bill?'), 'electricity-bill');
  assert.equal(billIntent('Compare our electricity bills'), 'electricity-bill');
  assert.equal(billIntent('Property tax versus my electricity bill'), 'mixed');
  assert.equal(billIntent('What are the electricity rates in Birmingham?'), 'local-electricity');
  assert.equal(billIntent('Am I overpaying my property taxes?'), 'tax-check');
  assert.equal(billIntent('Are my property taxes higher than they should be?'), 'tax-check');
  assert.equal(billIntent('How much are my property taxes?'), 'tax-check');
  assert.equal(billIntent('Why did the property taxes in my city go up?'), 'local-tax');
  assert.equal(billIntent('What are the property taxes for this house?'), 'tax-check');
  assert.equal(billIntent('Where do I open a coffee shop?'), null);
  assert.equal(decisionType('compare'), 'compare');
  assert.equal(decisionType('arbitrary'), 'custom');
});

test('U.S. city formatting accepts other places and state names, and catches duplicate casing', () => {
  assert.equal(formattedCity('  Spokane, washington '), 'Spokane, WA');
  assert.equal(formattedCity('Washington, District of Columbia'), 'Washington, DC');
  assert.equal(formattedCity('Denver, co'), 'Denver, CO');
  assert.equal(placeKey(formattedCity('St. Louis, Missouri')), placeKey(formattedCity('St Louis, MO')));
  for (const bad of ['', 'Denver', 'Denver, ZZ', 'Denver, CO, US', '12345, CO']) assert.equal(formattedCity(bad), null);
});

test('suggestions are local prefix matches and never masquerade as a verified search', () => {
  assert.deepEqual(sampleCityMatches(' chA'), ['Charlotte, NC']);
  assert.deepEqual(sampleCityMatches('Denver, CO'), []);
  assert.deepEqual(sampleCityMatches('Spokane'), []);
  assert.deepEqual(sampleCityMatches('a'), []);
});
