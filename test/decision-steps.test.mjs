import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/app/intelligence/decision-steps.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { billExample, decisionType, formattedCity, placeKey, sampleCityMatches } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('bill questions route deterministically; ambiguous or unrelated questions do not', () => {
  assert.equal(billExample('Why did my property taxes go up?'), 'tax');
  assert.equal(billExample('What changed on the electric bill?'), 'electricity');
  assert.equal(billExample('Property tax versus my electricity bill'), null);
  assert.equal(billExample('Where do I open a coffee shop?'), null);
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
