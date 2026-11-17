import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const source = fs.readFileSync(new URL('../src/app/intelligence/decision-steps.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { billIntent, decisionType, formattedCity, placeKey, sampleCityMatches, understandCityQuestion } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

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

test('cost-of-living wording supplies both cities and an optional annual salary', () => {
  for (const question of [
    'What is the difference in cost of living between Los Angeles and Birmingham, Alabama, if someone makes $90,000?',
    'If I earn $90,000 a year, how does the cost of living in LA compare to Birmingham, AL?',
    'Cost of living in Los Angeles, Calif. vs Birmingham AL on $90k a year?',
    'Compare LA and Birmingham (Alabama) for cost of living with an annual salary of $90,000.',
    'Los Angeles vs Birmingham, Ala. cost of living with a $90k salary',
    'Cost of living: Los Angeles or Birmingham, Alabama on $90k?',
  ]) assert.deepEqual(understandCityQuestion(question), {
    intent: 'cost-of-living', location: 'Los Angeles, CA', comparison: 'Birmingham, AL',
    needsComparison: true, annualSalary: 90000,
  }, question);

  assert.deepEqual(understandCityQuestion('Compare Springfield, Illinois with Madison, WI'), {
    intent: 'city-comparison', location: 'Springfield, IL', comparison: 'Madison, WI',
    needsComparison: true, annualSalary: null,
  });
  assert.deepEqual(understandCityQuestion('How much does housing cost in Birmingham, Alabama?'), {
    intent: 'housing', location: 'Birmingham, AL', comparison: null, needsComparison: false, annualSalary: null,
  });
});

test('ambiguous places and salary amounts stay unresolved', () => {
  assert.equal(understandCityQuestion('Compare Springfield and Birmingham, Alabama').location, null);
  assert.equal(understandCityQuestion('Compare Springfield and Birmingham, Alabama').comparison, 'Birmingham, AL');
  assert.equal(understandCityQuestion('Compare Springfield, IL to Springfield, Illinois').comparison, null);
  assert.equal(understandCityQuestion('Can you help me decide?').intent, 'unclear');
  assert.equal(understandCityQuestion('Compare apples and oranges').intent, 'unclear');
  assert.equal(understandCityQuestion('Compare Springfield and Birmingham').intent, 'city-comparison');
  assert.equal(billIntent('What does electricity cost in Birmingham?'), 'local-electricity');
  assert.equal(billIntent('What is the cost of electricity in Birmingham?'), 'local-electricity');
  for (const amount of ['on $7,500 per month', 'on $80k to $95k', 'on −$90k', 'on €90,000', 'on $100,000 CAD', 'on $0', 'on $900,00', 'on $90,000 and earning $20k extra', 'on $90k+', 'about $90k a year']) {
    assert.equal(understandCityQuestion('Compare LA and Birmingham, AL for cost of living ' + amount).annualSalary, null, amount);
  }
});
