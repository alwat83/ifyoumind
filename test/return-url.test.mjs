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
  assert.match(guard, /user\.emailVerified|ensureFreshVerification\(user\)/, 'the verified-email check is still there');
  const login = read('../src/app/auth/login/login.component.ts');
  assert.match(login, /safeReturnUrl\(this\.route\.snapshot\.queryParamMap\.get\('returnUrl'\)\)\?\?DEFAULT_RETURN_URL/);
  assert.equal((login.match(/navigateByUrl\(this\.destination\(\)\)/g) || []).length, 2, 'email and Google sign-in both return');
  assert.doesNotMatch(login, /window\.location|location\.href|location\.assign|navigateByUrl\((?!this\.destination\(\))/, 'no unvalidated or full-page redirect');
  assert.doesNotMatch(read('../src/app/return-url.ts'), /window|document|localStorage|sessionStorage/, 'pure function, no stored state');
});

test('every $79 entry point carries the report intent; free and Pro stay plain', () => {
  const home = read('../src/app/intelligence/public-landing.component.html');
  assert.match(home, /<a routerLink="\/register" \[queryParams\]="\{intent:'report'\}" class="primary">Build a report<\/a>/);
  assert.equal((home.match(/<a routerLink="\/register" class="secondary">[^<]+<\/a>/g) || []).length, 2, 'Free and Pro buttons stay plain, whatever their labels');
  const sample = read('../src/app/intelligence/market-report.component.html');
  assert.equal((sample.match(/routerLink="\/register" \[queryParams\]="\{intent:'report'\}"/g) || []).length, 2);
});

test('property: any output is an allowlisted in-app path with allowlisted parameters', () => {
  const parts = ['/', '//', '\\', 'app', 'decide', 'result', 'abc', '..', '.', '%2f', '%5C', '%2e', '?', '&', '=', '#', '@', ':', 'https:', 'evil.example',
    'type', 'business', 'intent', 'report', 'offer', 'pro', 'projectId', 'checkout', 'success', ' ', '\t', '\n', '∕', '／', '%00', 'javascript:', 'APP'];
  let seed = 7;
  const rand = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const ok = /^\/app(\/decide|\/pricing|\/account|\/result\/[A-Za-z0-9_-]{1,64})?(\?(type=[a-z_]{1,32}|intent=report|offer=(report|pro)|projectId=[A-Za-z0-9_-]{1,64})(&(type=[a-z_]{1,32}|intent=report|offer=(report|pro)|projectId=[A-Za-z0-9_-]{1,64}))*)?$/;
  for (let i = 0; i < 20000; i++) {
    let s = rand(3) ? '/' : '';
    for (let j = 0, n = 1 + rand(8); j < n; j++) s += parts[rand(parts.length)];
    const out = safeReturnUrl(s);
    if (out !== null) {
      assert.match(out, ok, `input ${JSON.stringify(s)} gave ${out}`);
      assert.equal(safeReturnUrl(out), out, 'output is stable when validated again');
    }
  }
  // Valid paths with random query strings: unknown or malformed parameters must be dropped, never passed through.
  const paths = ['/app', '/app/decide', '/app/pricing', '/app/account', '/app/result/p1'];
  const keys = ['type', 'intent', 'offer', 'projectId', 'checkout', 'returnUrl', 'email', 'next'];
  const vals = ['business', 'report', 'pro', 'p1', 'success', '//evil.example', 'a%40b.com', 'https://evil', 'BUSINESS', ''];
  let kept = 0;
  for (let i = 0; i < 5000; i++) {
    const q = Array.from({ length: 1 + rand(4) }, () => `${keys[rand(keys.length)]}=${vals[rand(vals.length)]}`).join('&');
    const out = safeReturnUrl(`${paths[rand(paths.length)]}?${q}`);
    assert.ok(out, 'a valid path is never refused because of its query');
    assert.match(out, ok, out);
    if (out.includes('?')) kept++;
  }
  assert.ok(kept > 1000, 'allowlisted parameters are kept');
  // Deliberately conservative: an encoded slash or backslash anywhere refuses the whole value.
  assert.equal(safeReturnUrl('/app/decide?type=business&next=https%3A%2F%2Fevil'), null);
});
