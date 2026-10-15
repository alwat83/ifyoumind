const { test } = require('node:test');
const assert = require('node:assert/strict');
const { qaMatch, parseQaExclusionConfig, hasExplicitEntries, excludedOrganizations } = require('../lib/intelligence/qa-exclusion');
const { qaExclusionAudit } = require('../lib/intelligence/growth-metrics');

const config = parseQaExclusionConfig({
  emails: ['Founder.Tester@Outlook.com', '', 3, 'not-an-address'],
  qaMailboxes: ['IfYouMind.QA@gmail.com', 'someone+qa@gmail.com'],
  uids: ['uid_listed', 'bad uid!'],
  organizationIds: ['org_manual'],
});
const verified = email => ({ email, emailVerified: true });
const match = (user, uid = 'uid_x') => qaMatch(uid, user, config).match;

test('config keeps only usable, explicit entries and counts the rest as ignored', () => {
  assert.deepEqual(config, {
    emails: ['founder.tester@outlook.com'],
    qaMailboxes: ['ifyoumind.qa@gmail.com'],
    uids: ['uid_listed'],
    organizationIds: ['org_manual'],
    ignoredEntries: 5,
  });
  const empty = parseQaExclusionConfig(undefined);
  assert.equal(hasExplicitEntries(empty), false);
  assert.equal(parseQaExclusionConfig({ emails: 'x@y.z' }).ignoredEntries, 1, 'a string instead of a list is reported, not guessed at');
  assert.equal(hasExplicitEntries(config), true);
});

test('only explicitly listed identities match', () => {
  assert.equal(match(verified('ifyoumind.qa@gmail.com')), 'mailbox');
  assert.equal(match(verified('IfYouMind.QA+run-7@Gmail.com')), 'mailbox', 'aliases of a declared QA mailbox');
  assert.equal(match(verified('founder.tester@outlook.com')), 'email');
  assert.equal(match(verified('f04-free-decision.abc@qa.ifyoumind.test')), 'fixture');
  assert.equal(match({ email: 'anyone@example.com', customClaims: { qa: true } }), 'claim');
  assert.equal(match(undefined, 'uid_listed'), 'uid');
});

test('legitimate customers are never excluded by alias, provider or domain pattern', () => {
  for (const email of [
    'customer@gmail.com',
    'customer+ifyoumind@gmail.com',          // a real customer's own alias
    'founder.tester+x@outlook.com',          // aliases of an exact email entry are not implied
    'someone@gmail.com',                     // base of an invalid "+" mailbox entry
    'someone+qa@gmail.com',
    'ifyoumind.qa@outlook.com',              // same local part, different provider
    'ifyoumindqa@gmail.com',                 // Gmail ignores dots, this code does not guess
    'qa@ifyoumind.com',
    'x@notqa.ifyoumind.test',
    'x@qa.ifyoumind.test.example.com',
  ]) assert.equal(match(verified(email)), null, email);
  assert.equal(match({ email: 'anyone@example.com', customClaims: { qa: 'true' } }), null, 'claim must be boolean true');
  assert.equal(match(null), null);
});

test('an unverified address never excludes anything; it is reported instead', () => {
  for (const email of ['ifyoumind.qa+r1@gmail.com', 'founder.tester@outlook.com']) {
    assert.deepEqual(qaMatch('uid_x', { email, emailVerified: false }, config), { match: null, unverifiedAddressMatch: true }, email);
  }
  assert.deepEqual(qaMatch('uid_x', { email: 'customer@gmail.com' }, config), { match: null, unverifiedAddressMatch: false });
});

test('excludedOrganizations resolves creators, keeps customers and counts every rule', async () => {
  const creators = new Map([['org_box', 'uid_box'], ['org_alias', 'uid_alias'], ['org_customer', 'uid_customer'],
    ['org_gone', null], ['org_fixture', 'uid_fixture'], ['org_unverified', 'uid_unverified'], ['org_uid', 'uid_listed']]);
  const users = new Map([
    ['uid_box', verified('ifyoumind.qa@gmail.com')],
    ['uid_alias', verified('ifyoumind.qa+r7@gmail.com')],
    ['uid_customer', verified('real.person+ifyoumind@gmail.com')],
    ['uid_fixture', { email: 'f02-verified.x@qa.ifyoumind.test' }],
    ['uid_unverified', { email: 'ifyoumind.qa+r8@gmail.com', emailVerified: false }],
  ]);
  const calls = [];
  const deps = {
    async creatorsOf(ids) { calls.push(['creators', ids]); return new Map(ids.map(id => [id, creators.get(id) ?? null])); },
    async usersOf(uids) { calls.push(['users', uids]); return new Map(uids.filter(u => users.has(u)).map(u => [u, users.get(u)])); },
  };
  const result = await excludedOrganizations(['org_box', 'org_alias', 'org_customer', 'org_gone', 'org_fixture', 'org_manual', 'org_unverified', 'org_uid', 'org_box'], config, deps);
  assert.deepEqual([...result.excluded].sort(), ['org_alias', 'org_box', 'org_fixture', 'org_manual', 'org_uid']);
  assert.deepEqual(result.byRule, { organizationId: 1, uid: 1, claim: 0, fixture: 1, email: 0, mailbox: 2 });
  assert.equal(result.unverifiedAddressMatches, 1);
  assert.ok(!calls[0][1].includes('org_manual'), 'manually listed workspaces need no lookup');
  assert.equal((await excludedOrganizations([], config, deps)).excluded.size, 0);
});

test('a missing or empty config is a warning, never a clean bill of health', () => {
  const base = { ignoredEntries: 0, excludedOrganizations: 0, byRule: {}, unverifiedAddressMatches: 0, excludedEvents: 0, excludedPayments: 0, excludedLivePayments: 0 };
  const missing = qaExclusionAudit({ ...base, exists: false, configured: false });
  assert.equal(missing.status, 'missing');
  assert.match(missing.warnings[0], /has not been created.*may include your own QA activity/);
  const empty = qaExclusionAudit({ ...base, exists: true, configured: false });
  assert.equal(empty.status, 'empty');
  assert.match(empty.warnings[0], /no usable entries/);
  const active = qaExclusionAudit({ ...base, exists: true, configured: true, excludedOrganizations: 2, excludedEvents: 9 });
  assert.equal(active.status, 'active');
  assert.deepEqual(active.warnings, []);
  assert.equal(active.excludedEvents, 9, 'counts stay visible');
  const noisy = qaExclusionAudit({ ...base, exists: true, configured: true, ignoredEntries: 2, unverifiedAddressMatches: 1 });
  assert.equal(noisy.warnings.length, 2);
});
