const { test } = require('node:test');
const assert = require('node:assert/strict');
const { canonicalEmail, isQaIdentity, parseQaExclusionConfig, excludedOrganizations } = require('../lib/intelligence/qa-exclusion');

const config = parseQaExclusionConfig({ emails: ['IfYouMind.QA.Test@gmail.com', '', 3], organizationIds: ['org_manual'] });

test('config parsing keeps only strings and canonicalises emails', () => {
  assert.deepEqual(config, { emails: ['ifyoumind.qa.test@gmail.com'], organizationIds: ['org_manual'] });
  assert.deepEqual(parseQaExclusionConfig(undefined), { emails: [], organizationIds: [] });
  assert.deepEqual(parseQaExclusionConfig({ emails: 'x@y.z' }), { emails: [], organizationIds: [] });
});

test('plus-tag aliases of a listed QA address match it; other addresses never do', () => {
  assert.equal(canonicalEmail(' IfYouMind.QA.Test+r1@Gmail.com '), 'ifyoumind.qa.test@gmail.com');
  for (const email of ['ifyoumind.qa.test@gmail.com', 'ifyoumind.qa.test+r1@gmail.com', 'IFYOUMIND.QA.TEST+run-2@GMAIL.COM', 'f04-free-decision.abc@qa.ifyoumind.test']) {
    assert.equal(isQaIdentity({ email }, config), true, email);
  }
  for (const email of ['customer@gmail.com', 'ifyoumind.qa.test@outlook.com', 'qa.ifyoumind.test@gmail.com', 'x@notqa.ifyoumind.test', '', null]) {
    assert.equal(isQaIdentity({ email }, config), false, String(email));
  }
  assert.equal(isQaIdentity({ email: 'anyone@example.com', customClaims: { qa: true } }, config), true, 'qa claim');
  assert.equal(isQaIdentity(undefined, config), false);
});

test('excludedOrganizations resolves workspace creators and keeps genuine customers', async () => {
  const creators = new Map([['org_qa', 'uid_qa'], ['org_alias', 'uid_alias'], ['org_customer', 'uid_customer'], ['org_gone', null], ['org_fixture', 'uid_fixture']]);
  const users = new Map([
    ['uid_qa', { email: 'ifyoumind.qa.test@gmail.com' }],
    ['uid_alias', { email: 'ifyoumind.qa.test+r7@gmail.com' }],
    ['uid_customer', { email: 'real.person@gmail.com' }],
    ['uid_fixture', { email: 'f02-verified.x@qa.ifyoumind.test' }],
  ]);
  const calls = [];
  const deps = {
    async creatorsOf(ids) { calls.push(['creators', ids]); return new Map(ids.map(id => [id, creators.get(id) ?? null])); },
    async usersOf(uids) { calls.push(['users', uids]); return new Map(uids.filter(u => users.has(u)).map(u => [u, users.get(u)])); },
  };
  const result = await excludedOrganizations(['org_qa', 'org_alias', 'org_customer', 'org_gone', 'org_fixture', 'org_manual', 'org_qa'], config, deps);
  assert.deepEqual([...result].sort(), ['org_alias', 'org_fixture', 'org_manual', 'org_qa']);
  assert.ok(!calls[0][1].includes('org_manual'), 'manually listed workspaces need no lookup');
  assert.deepEqual(await excludedOrganizations([], config, deps), new Set());
});
