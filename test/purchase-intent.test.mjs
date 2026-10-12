import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('../src/app/purchase-intent.ts'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const intent = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const memory = () => { const m = new Map(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k) }; };

test('only the report intent is recognised', () => {
  assert.equal(intent.parseIntent('report'), 'report');
  for (const v of ['pro', 'REPORT', '', null, undefined, 'report&x=1']) assert.equal(intent.parseIntent(v), null);
});

test('intent survives verification for a day, then expires, and is cleared after use', () => {
  const store = memory();
  intent.rememberIntent('report', 1000, store);
  assert.equal(intent.readIntent(1000 + 60 * 60 * 1000, store), 'report');
  assert.equal(intent.readIntent(1000 + 25 * 60 * 60 * 1000, store), null);
  intent.clearIntent(store);
  assert.equal(intent.readIntent(1000, store), null);
  assert.equal(intent.readIntent(1000, null), null, 'blocked storage is not an error');
});

test('query parameters carry the intent only when there is one', () => {
  assert.deepEqual(intent.intentParams({ type: 'business' }, 'report'), { type: 'business', intent: 'report' });
  assert.deepEqual(intent.intentParams({ type: 'business' }, null), { type: 'business' });
});

test('the journey keeps verification and payment in place', () => {
  const report = read('../src/app/intelligence/market-report.component.html');
  assert.equal((report.match(/routerLink="\/register" \[queryParams\]="\{intent:'report'\}"/g) || []).length, 2, 'both sample $79 buttons carry the intent');
  assert.match(report, /\[routerLink\]="\['\/app\/pricing'\]" \[queryParams\]="\{offer:'report',projectId:project\?\.id\}" class="report-upgrade">Get the full report · \$79/);
  const ts = read('../src/app/intelligence/market-report.component.ts');
  assert.match(ts, /!this\.sampleMode&&this\.purchaseIntent&&!this\.reportPurchased&&!this\.canUnlockWithPro/);
  const register = read('../src/app/auth/register/register.component.ts');
  assert.match(register, /await this\.router\.navigate\(\['\/verify-email'\]\)/, 'email sign-ups still verify first');
  assert.match(register, /app\/decide\?type=business\$\{this\.intent\?`&intent=\$\{this\.intent\}`:''\}/);
  const guard = read('../src/app/auth.guard.ts');
  assert.match(guard, /verify-email/, 'the route guard still sends unverified accounts to verify');
  assert.equal(read('../src/app/purchase-intent.ts').includes('checkout'), true, 'documented as not touching checkout');
  assert.doesNotMatch(read('../src/app/purchase-intent.ts'), /createCommercialCheckout|unlock|decisionReportPurchased/);
});
