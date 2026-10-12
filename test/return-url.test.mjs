import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('../src/app/return-url.ts'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { safeReturnUrl, loginParams, DEFAULT_RETURN_URL } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('in-app paths come back rebuilt, keeping only allowed parameters', () => {
  assert.equal(safeReturnUrl('/app'), '/app');
  assert.equal(safeReturnUrl('/app/decide?type=business&intent=report'), '/app/decide?type=business&intent=report');
  assert.equal(safeReturnUrl('/app/result/AbC_123-x?intent=report'), '/app/result/AbC_123-x?intent=report');
  assert.equal(safeReturnUrl('/app/pricing?offer=report&projectId=p1'), '/app/pricing?offer=report&projectId=p1');
  assert.equal(safeReturnUrl('/app/decide?type=business&intent=pro'), '/app/decide?type=business', 'only the report intent is kept');
  assert.equal(safeReturnUrl('/app/pricing?offer=report&checkout=success'), '/app/pricing?offer=report', 'checkout results are never replayed');
  assert.equal(safeReturnUrl('/app/decide?type=business&type=evil'), '/app/decide?type=business', 'first value wins');
  assert.equal(safeReturnUrl('/app/decide?utm_source=x&email=a%40b.com'), '/app/decide', 'unknown parameters, including personal data, are dropped');
});

test('anything that could leave the app or reach an unexpected page is refused', () => {
  const refused = [
    undefined, null, 42, '', 'app', 'https://evil.example/app', 'http://ifyoumind.com/app',
    '//evil.example/app', '/\\evil.example', '\\\\evil.example', '/%2F%2Fevil.example', '/app%2F..%2F..%2Flogin',
    '/app/%5c..', 'javascript:alert(1)', '/javascript:alert(1)', 'data:text/html,x', ' /app', '/app ',
    '/app\n/decide', '/app\t', '/app#frag', '/app/../login', '/app/decide/../../register', '/login', '/register',
    '/app/growth', '/app/advanced', '/app/result/', '/app/result/a/b', '/app/result/' + 'x'.repeat(65),
    '/' + 'a'.repeat(600), '/app/decide\u0000', '/APP', '/app/decide%00',
  ];
  for (const value of refused) assert.equal(safeReturnUrl(value), null, JSON.stringify(value));
});

test('the sign-in page only gets a return path when it is safe and not the default', () => {
  assert.deepEqual(loginParams('/app/decide?type=business&intent=report'), { returnUrl: '/app/decide?type=business&intent=report' });
  assert.deepEqual(loginParams('/app'), {});
  assert.deepEqual(loginParams('/app/growth'), {});
  assert.deepEqual(loginParams('//evil.example'), {});
  assert.equal(DEFAULT_RETURN_URL, '/app');
});

test('the guard and sign-in page use the validator, and access control is unchanged', () => {
  const guard = read('../src/app/auth.guard.ts');
  assert.match(guard, /router\.navigate\(\['\/login'\],\{queryParams:loginParams\(state\.url\)\}\)/, 'signed-out visitors keep their place');
  assert.match(guard, /router\.navigate\(\['\/verify-email'\]\)/, 'unverified accounts still go to verify first');
  assert.match(guard, /user\.emailVerified/, 'the verified-email check is still there');
  const login = read('../src/app/auth/login/login.component.ts');
  assert.match(login, /safeReturnUrl\(this\.route\.snapshot\.queryParamMap\.get\('returnUrl'\)\)\?\?DEFAULT_RETURN_URL/);
  assert.equal((login.match(/navigateByUrl\(this\.destination\(\)\)/g) || []).length, 2, 'email and Google sign-in both return');
  assert.doesNotMatch(login, /window\.location|location\.href|location\.assign|navigateByUrl\((?!this\.destination\(\))/, 'no unvalidated or full-page redirect');
  assert.doesNotMatch(read('../src/app/return-url.ts'), /window|document|localStorage|sessionStorage/, 'pure function, no stored state');
});

test('every $79 entry point carries the report intent; free and Pro stay plain', () => {
  const home = read('../src/app/intelligence/public-landing.component.html');
  assert.match(home, /<a routerLink="\/register" \[queryParams\]="\{intent:'report'\}" class="primary">Build a report<\/a>/);
  assert.match(home, /<a routerLink="\/register" class="secondary">Try it<\/a>/);
  assert.match(home, /<a routerLink="\/register" class="secondary">Start free<\/a>/);
  const sample = read('../src/app/intelligence/market-report.component.html');
  assert.equal((sample.match(/routerLink="\/register" \[queryParams\]="\{intent:'report'\}"/g) || []).length, 2);
});
