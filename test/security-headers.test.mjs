import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../firebase.json', import.meta.url), 'utf8'));
const rules = config.hosting.headers || [];
const values = (rule) => Object.fromEntries(rule.headers.map(h => [h.key.toLowerCase(), h.value]));

test('every hosted response carries Referrer-Policy and nosniff', () => {
  const all = rules.find(h => h.source === '**');
  assert.ok(all, 'a ** header rule exists');
  const headers = values(all);
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin', 'other sites see only the origin, never paths or query strings');
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], undefined, 'framing rules must not reach Firebase reserved paths');
});

test('app pages cannot be framed by other sites, but Firebase Auth helpers under /__/ still can', () => {
  const app = rules.find(h => h.regex);
  assert.ok(app, 'a regex rule for app pages exists');
  const headers = values(app);
  assert.equal(headers['x-frame-options'], 'SAMEORIGIN');
  assert.match(headers['permissions-policy'], /camera=\(\)/);
  assert.match(headers['permissions-policy'], /payment=\(\)/, 'payment happens on Stripe Checkout, never in this origin');
  // signInWithPopup embeds https://<authDomain>/__/auth/iframe cross-origin; it must not get X-Frame-Options.
  const re = new RegExp(app.regex);
  for (const path of ['/', '/app/pricing', '/sample-report', '/register', '/_x']) assert.ok(re.test(path), path);
  for (const path of ['/__/auth/iframe', '/__/auth/handler', '/__/firebase/init.js']) assert.equal(re.test(path), false, path);
});

test('only known private app routes use the noindex shell; unknown URLs retain HTTP 404', () => {
  assert.equal(config.hosting.cleanUrls, true);
  assert.deepEqual(config.hosting.rewrites, ['/login', '/register', '/verify-email', '/app', '/app/**'].map(source => ({ source, destination: '/app-shell.html' })));
  assert.ok(!config.hosting.rewrites.some(rule => rule.source === '**'));
  const appRedirect = config.hosting.redirects[0];
  assert.ok(new RegExp(appRedirect.regex).test('/sample-report/'));
  assert.equal(appRedirect.destination, '/:1');
  assert.equal(appRedirect.type, 301);
  assert.ok(!new RegExp(appRedirect.regex).test('/guides/'));
});
