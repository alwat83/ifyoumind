import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('../src/app/intelligence/plan-messages.ts'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { planMessages } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('today: a $39 subscriber at the $39 list price sees their price and no earlier-price note', () => {
  const m = planMessages({ monthlyUsd: 39, grandfathered: false, listMonthlyUsd: 39, cancelAtPeriodEnd: false });
  assert.equal(m.price, 'You pay $39/month.');
  assert.equal(m.earlierPrice, null);
  assert.match(m.cancellation, /cancel at any time/);
  assert.match(m.cancellation, /already unlocked stay unlocked/);
  assert.doesNotMatch(m.cancellation, /current price applies/);
});

test('after a list-price change, a grandfathered subscriber sees their own price and what cancelling means', () => {
  const m = planMessages({ monthlyUsd: 39, grandfathered: true, listMonthlyUsd: 149, cancelAtPeriodEnd: false });
  assert.equal(m.price, 'You pay $39/month.');
  assert.match(m.earlierPrice, /earlier price\. It stays \$39\/month for as long as your subscription stays active; the current price for new subscribers is \$149\/month/);
  assert.match(m.cancellation, /If you subscribe again later, the current price applies/);
});

test('a subscription set to end says so and how to keep it', () => {
  const m = planMessages({ monthlyUsd: 39, grandfathered: true, listMonthlyUsd: 149, cancelAtPeriodEnd: true });
  assert.match(m.cancellation, /set to end at the close of this billing period/);
  assert.match(m.cancellation, /open Manage billing before then/);
});

test('an unknown price is never guessed', () => {
  const m = planMessages({ monthlyUsd: null, grandfathered: false, listMonthlyUsd: 39, cancelAtPeriodEnd: false });
  assert.equal(m.price, null);
  assert.equal(m.earlierPrice, null);
  assert.equal(planMessages(null).price, null);
});

test('the account page shows the subscriber price only for Pro and never hard-codes an amount', () => {
  const html = read('../src/app/intelligence/account.component.html');
  assert.match(html, /status\.plan==='pro' && plan as m/);
  assert.doesNotMatch(html.slice(html.indexOf('plan as m'), html.indexOf('</ng-container>', html.indexOf('plan as m'))), /\$\d/);
});
