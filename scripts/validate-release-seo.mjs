// Validate observations from audit-seo.mjs against release acceptance criteria.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const audit = JSON.parse(await readFile(process.argv[2], 'utf8'));
assert.equal(audit.observations.length, 56, 'all routes, widths and JavaScript modes audited');
for (const row of audit.observations) {
  const path = row.path.split('?')[0];
  const privatePage = /^\/(login|register|app)(\/|$)/.test(path);
  const missing = ['/seo-audit-missing-page', '/life/quick-compare'].includes(path);
  const label = `${row.path} JS=${row.javascript} width=${row.width}`;
  assert.equal(row.status, missing ? 404 : 200, label);
  assert.equal(row.robots.length, 1, `${label}: one robots tag`);
  assert.equal(row.robots[0], privatePage || missing ? 'noindex,nofollow' : 'index,follow', label);
  assert.ok(row.title, `${label}: title`);
  assert.ok(!row.schema.includes('INVALID_JSON'), `${label}: valid JSON-LD`);
  if (privatePage || missing) {
    assert.deepEqual(row.canonicals, [], `${label}: no misleading public canonical`);
    assert.deepEqual(row.schema, [], `${label}: no inherited offer schema`);
    continue;
  }
  assert.ok(row.description, `${label}: description`);
  assert.deepEqual(row.canonicals, [`https://ifyoumind.com${path}`], label);
  assert.equal(row.ogUrl, row.canonicals[0], `${label}: share URL`);
  assert.equal(row.twitterTitle, row.title, `${label}: share title`);
  const expectedType = path === '/' ? 'WebApplication' : path === '/guides/' ? 'CollectionPage' : path.startsWith('/guides/') ? 'Article' : null;
  const types = row.schema.flatMap(schema => schema['@graph'] || [schema]).map(schema => schema['@type']);
  if (expectedType) assert.ok(types.includes(expectedType), `${label}: ${expectedType} schema`);
  else assert.deepEqual(types, [], `${label}: no unrelated schema`);
  // The offline production audit deliberately cannot load the sample's Firebase report body.
  // Its complete body/accessibility is verified by the separate emulator browser suite.
  const offlineSample = audit.externalRequestsBlocked && path === '/sample-report';
  if (!offlineSample && (row.javascript || path.startsWith('/guides/'))) assert.equal(row.h1.length, 1, `${label}: one rendered h1`);
  assert.ok(row.overflow <= 1, `${label}: no document overflow`);
}
const sitemap = audit.resources.find(resource => resource.path === '/sitemap.xml');
assert.equal(sitemap.status, 200);
const urls = [...sitemap.body.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => match[1]);
assert.equal(urls.length, 9);
assert.equal(new Set(urls).size, 9);
assert.ok(urls.every(url => url.startsWith('https://ifyoumind.com/') && !/\/app|\/life|\/login|\/register/.test(url)));
const robots = audit.resources.find(resource => resource.path === '/robots.txt');
assert.equal(robots.status, 200);
assert.match(robots.body, /Sitemap: https:\/\/ifyoumind.com\/sitemap.xml/);
for (const redirect of audit.redirects) {
  assert.equal(redirect.status, 301, `${redirect.path}: permanent redirect`);
  assert.ok(redirect.location);
}
console.log('PASS: 56 raw/rendered SEO observations, 9 sitemap URLs, robots, JSON-LD, redirects and Life 404.');
