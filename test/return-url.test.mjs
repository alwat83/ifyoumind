import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';

const read = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const compiled = ts.transpileModule(read('../src/app/return-url.ts'), { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { safeReturnUrl, loginParams, decisionReturnUrl, DEFAULT_RETURN_URL } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('return paths are rebuilt using clean URLs and keep only permitted parameters', () => {
  assert.equal(safeReturnUrl('/app'), '/decisions');
  assert.equal(safeReturnUrl('/app/decide?type=business&intent=report'), '/decide?type=business&intent=report');
  assert.equal(safeReturnUrl('/app/result/AbC_123-x?intent=report'), '/decisions/AbC_123-x?intent=report');
  assert.equal(safeReturnUrl('/app/pricing?offer=report&projectId=p1'), '/pricing?offer=report&projectId=p1');
  assert.equal(safeReturnUrl('/decide?type=business&intent=pro'), '/decide?type=business', 'only the report intent is kept');
  assert.equal(safeReturnUrl('/pricing?offer=report&checkout=success'), '/pricing?offer=report', 'checkout results are never replayed');
  assert.equal(safeReturnUrl('/decide?type=business&type=evil'), '/decide?type=business', 'first value wins');
  assert.equal(safeReturnUrl('/decide?utm_source=x&email=a%40b.com'), '/decide', 'unknown parameters, including personal data, are dropped');
});

test('shared saved findings retain only a validated workspace context through sign-in',()=>{
 assert.equal(safeReturnUrl('/decisions/p1?organizationId=org-2'),'/decisions/p1?organizationId=org-2');
 assert.equal(safeReturnUrl('/decisions/p1?organizationId=org-2&organizationId=other&question=private'),'/decisions/p1?organizationId=org-2');
 for(const value of ['../foreign','https://evil.example'])assert.equal(safeReturnUrl('/decisions/p1?organizationId='+encodeURIComponent(value)),null);
 assert.equal(safeReturnUrl('/decisions/p1?organizationId='+'a'.repeat(129)),'/decisions/p1');
 for(const path of ['/decide','/account','/pricing','/decisions'])assert.equal(safeReturnUrl(path+'?organizationId=org-2'),path);
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
  assert.deepEqual(loginParams('/app/decide?type=business&intent=report'), { returnUrl: '/decide?type=business&intent=report' });
  assert.deepEqual(loginParams('/app'), {});
  assert.deepEqual(loginParams('/app/growth'), {});
  assert.deepEqual(loginParams('//evil.example'), {});
  assert.equal(DEFAULT_RETURN_URL, '/decisions');
});

test('the guard and sign-in page use the validator, and access control is unchanged', () => {
  const guard = read('../src/app/auth.guard.ts');
  assert.match(guard, /router\.navigate\(\['\/login'\],\{queryParams:loginParams\(state\.url\)\}\)/, 'signed-out visitors keep their place');
  assert.match(guard, /router\.navigate\(\['\/verify-email'\],/, 'unverified accounts still go to verify first');
  assert.match(guard, /user\.emailVerified/, 'the verified-email check is still there');
  const login = read('../src/app/auth/login/login.component.ts');
  assert.match(login, /safeReturnUrl\(this\.route\.snapshot\.queryParamMap\.get\('returnUrl'\)\)\?\?DEFAULT_RETURN_URL/);
  assert.equal((login.match(/navigateByUrl\(this\.destination\(\)\)/g) || []).length, 2, 'email and Google sign-in both return');
  assert.doesNotMatch(login, /window\.location|location\.href|location\.assign|navigateByUrl\((?!this\.destination\(\))/, 'no unvalidated or full-page redirect');
  assert.doesNotMatch(read('../src/app/return-url.ts'), /window|document|localStorage|sessionStorage/, 'pure function, no stored state');
});

test('the sample entry and $79 checkout preserve the report path and legacy Pro stays managed in Account', () => {
  const home = read('../src/app/intelligence/public-landing.component.html');
  assert.match(home, /routerLink="\/sample-report" class="button">View a Sample Report/);
  const reportEntry = '/decide?type=business&intent=report';
  assert.deepEqual(loginParams(reportEntry), { returnUrl: reportEntry });
  assert.equal(decisionReturnUrl(reportEntry), reportEntry);
  const pricing = read('../src/app/intelligence/pricing.component.html');
  assert.match(pricing, /\(click\)="request\('report'\)"/);
  assert.doesNotMatch(pricing, /\(click\)="request\('pro'\)"/);
});

test('property: any output is an allowlisted in-app path with allowlisted parameters', () => {
  const parts = ['/', '//', '\\', 'app', 'decide', 'result', 'abc', '..', '.', '%2f', '%5C', '%2e', '?', '&', '=', '#', '@', ':', 'https:', 'evil.example',
    'type', 'business', 'intent', 'report', 'offer', 'pro', 'projectId', 'checkout', 'success', ' ', '\t', '\n', '∕', '／', '%00', 'javascript:', 'APP'];
  let seed = 7;
  const rand = (n) => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed % n; };
  const ok = /^\/(?:decide|pricing|account|decisions(?:\/[A-Za-z0-9_-]{1,64})?)(\?(type=[a-z_]{1,32}|intent=report|offer=(report|pro)|projectId=[A-Za-z0-9_-]{1,64}|organizationId=[A-Za-z0-9_-]{1,128})(&(type=[a-z_]{1,32}|intent=report|offer=(report|pro)|projectId=[A-Za-z0-9_-]{1,64}|organizationId=[A-Za-z0-9_-]{1,128}))*)?$/;
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
  const paths = ['/decisions', '/decide', '/pricing', '/account', '/decisions/p1', '/app', '/app/result/p1'];
  const keys = ['type', 'intent', 'offer', 'projectId', 'organizationId', 'checkout', 'returnUrl', 'email', 'next'];
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

test('decision auth handoffs keep only a known type and commercial intent', () => {
  assert.equal(decisionReturnUrl('/app/decide?type=compare&intent=report&location=private&question=mine'), '/decide?type=compare&intent=report');
  assert.equal(decisionReturnUrl('/app/decide?type=private&offer=pro'), '/decide');
  assert.equal(decisionReturnUrl('/app/pricing?intent=report'), null);
  assert.equal(decisionReturnUrl('//outside.example/app/decide'), null);
});
