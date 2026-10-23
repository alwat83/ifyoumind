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
  assert.match(home, /Start free\. Go deeper when you need to\./);
  assert.match(home, /class="secondary">Start a free brief<\/a>/);
  assert.match(home, /class="secondary">Create an account for Pro<\/a>/);
  assert.doesNotMatch(home, /Try the thinking for free|class="secondary">Start free<\/a>/);
  assert.match(home, /<h3>\$0<\/h3>/);
  assert.match(home, /<h3>\$79<span> \/ report<\/span><\/h3>/);
  assert.match(home, /<h3>\$39<span> \/ month<\/span><\/h3>/);
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
