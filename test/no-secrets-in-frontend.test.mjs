import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = new URL('..', import.meta.url).pathname;
function files(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) files(p, out); else out.push(p);
  }
  return out;
}

test('browser code never calls the Census API or names a server secret', () => {
  const sources = files(path.join(root, 'src')).filter(f => /\.(ts|html)$/.test(f));
  for (const file of sources) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /CENSUS_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET/, file);
    assert.doesNotMatch(text, /api\.census\.gov[^'"`\s]*[?&]key=/, file);
  }
});

test('the built site contains no server secret names or keyed Census URLs', (t) => {
  const dist = path.join(root, 'dist');
  if (!fs.existsSync(dist)) { t.skip('no build output; run npm run build first'); return; }
  for (const file of files(dist).filter(f => /\.(js|html|json)$/.test(f))) {
    const text = fs.readFileSync(file, 'utf8');
    assert.doesNotMatch(text, /CENSUS_API_KEY|STRIPE_SECRET_KEY|STRIPE_WEBHOOK_SECRET|sk_live_|sk_test_|whsec_/, file);
    assert.doesNotMatch(text, /api\.census\.gov[^'"`\s]*[?&]key=/, file);
  }
});
