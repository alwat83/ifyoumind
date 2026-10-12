import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const config = JSON.parse(fs.readFileSync(new URL('../firebase.json', import.meta.url), 'utf8'));

test('every hosted response carries the baseline security headers', () => {
  const all = (config.hosting.headers || []).find(h => h.source === '**');
  assert.ok(all, 'a ** header rule exists');
  const headers = Object.fromEntries(all.headers.map(h => [h.key.toLowerCase(), h.value]));
  assert.equal(headers['referrer-policy'], 'strict-origin-when-cross-origin', 'other sites see only the origin, never paths or query strings');
  assert.equal(headers['x-content-type-options'], 'nosniff');
  assert.equal(headers['x-frame-options'], 'SAMEORIGIN', 'the site cannot be framed by other sites');
  assert.match(headers['permissions-policy'], /camera=\(\)/);
  assert.match(headers['permissions-policy'], /payment=\(\)/, 'payment happens on Stripe Checkout, never in this origin');
});

test('the SPA rewrite is unchanged', () => {
  assert.deepEqual(config.hosting.rewrites, [{ source: '**', destination: '/index.html' }]);
});
