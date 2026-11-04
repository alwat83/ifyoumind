import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(d => d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]);

test('Q4: the report counts sources cited and no longer shows a "coverage" score', () => {
  const html = read('../src/app/intelligence/market-report.component.html');
  assert.match(html, /<span>Sources cited<\/span>\s*<strong>\{\{ sourcesCited \}\}<\/strong>/);
  assert.match(html, /it is not a measure of how certain the findings are/);
  for (const file of walk(new URL('../src', import.meta.url).pathname)) {
    if (/\.(ts|html)$/.test(file)) assert.doesNotMatch(fs.readFileSync(file, 'utf8'), /source coverage/i, file);
  }
});

test('Q5: pricing buttons say what happens, and the prices are unchanged', () => {
  const home = read('../src/app/intelligence/public-landing.component.html');
  assert.match(home, /Bill discovery is free\. Business reports are optional\./);
  assert.match(home, /Business account required\. No credit card for a free brief/);
  assert.match(home, /Business brief/);
  assert.match(home, /<b>Free /);
  assert.match(home, /<b>\$79<small>one time<\/small><\/b>/);
  assert.match(home, /<b>\$39<small>per month<\/small><\/b>/);
  const pricing = read('../src/app/intelligence/pricing.component.html');
  assert.match(pricing, /If you cancel Pro, reports you already unlocked with it stay unlocked\./);
  assert.match(pricing, /\$\{\{ status\.pricing\.proMonthlyUsd \}\}/, 'Pro price still comes from the server');
});

test('Q5: the "stays unlocked" line matches the entitlement code', () => {
  const logic = read('../functions/src/intelligence/report-entitlement-logic.ts');
  assert.match(logic, /if\(project\?\.decisionReportIncludedWithPro===true\)return 'pro';/, 'access depends on the report flag, not on an active subscription');
});

test('Q6: the register button is always active and shows what to fix', () => {
  const html = read('../src/app/auth/register/register.component.html');
  assert.doesNotMatch(html, /\[disabled\]="registerForm\.invalid"/);
  assert.match(html, /\(ngSubmit\)="submit\(registerForm\)"/);
  for (const [id, words] of [['name-error', 'Enter your name.'], ['email-error', 'Enter an email address'], ['password-error', 'Use at least 6 characters.']]) {
    assert.match(html, new RegExp(`id="${id}" class="field-error" \\*ngIf="showErrors && [a-zA-Z]+Field\\.invalid">${words}`));
    assert.match(html, new RegExp(`aria-describedby="${id}"`));
  }
  const ts = read('../src/app/auth/register/register.component.ts');
  assert.match(ts, /if\(form\.invalid\)\{\s*this\.showErrors=true;/);
  assert.match(ts, /await this\.router\.navigate\(\['\/verify-email'\]\)/, 'email sign-ups still verify first');
});
