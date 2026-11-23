import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = fs.readFileSync('src/app/services/analytics-policy.ts', 'utf8'), js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ES2022, target: ts.ScriptTarget.ES2022 } }).outputText;
const { GA4_ID, GA4_STREAM_ID, GA4_PRODUCTION_ENABLED, safePage, safeEvent, safeAttribution, checkoutSessionFromUrl, AcquisitionTracker } = await import('data:text/javascript;base64,' + Buffer.from(js).toString('base64'));
const flush = () => new Promise(r => setImmediate(r));
function fixture(start = async () => true) { const events = [], port = { start, send: (name, params) => events.push({ name, params }), stop: () => events.push({ stop: true }) }; return { events, t: new AcquisitionTracker(port, { campaign_source: 'instagram' }) }; }
test('one exact measurement destination; reviewed activation candidate still requires consent', () => { assert.equal(GA4_ID, 'G-NRT31062LW'); assert.equal(GA4_STREAM_ID, '16394318092'); assert.equal(GA4_PRODUCTION_ENABLED, true); });
test('route normalization removes queries/fragments and private decision IDs', () => { assert.deepEqual(safePage('/decisions/PrivateId?organizationId=secret#email'), { path: '/decisions/detail', title: 'Saved finding' }); for (const p of ['/discover/', '/unknown', '//evil.com', '/decisions/private%40email'])
    assert.equal(safePage(p), null); assert.equal(safePage('/pricing?projectId=private&question=secret').path, '/pricing'); });
test('unknown fields, private numbers, report content and all identifiers rejected', () => { for (const field of ['email', 'user_id', 'organizationId', 'projectId', 'question', 'value', 'currency', 'transaction_id', 'bill', 'salary', 'page_location'])
    assert.equal(safeEvent('checkout_started', { offer: 'report', [field]: 'secret' }), null); assert.equal(safeEvent('purchase', { value: 79 }), null); assert.equal(safeEvent('evidence_revealed', { example: 'my bill' }), null); assert.equal(safeEvent('page_view', { page_location: '/private' }), null); });
test('only approved event names and enum values accepted', () => { for (const name of ['free_tax_example_viewed', 'free_electricity_example_viewed'])
    assert.deepEqual(safeEvent(name, {}), {}); for (const offer of ['report', 'starter', 'plus'])
    assert.deepEqual(safeEvent('purchase_verified', { offer }), { offer }); assert.deepEqual(safeEvent('registration_completed', { method: 'email' }), { method: 'email' }); });
test('UTM allowlist preserves campaign attribution but rejects arbitrary/private labels', () => { assert.deepEqual(safeAttribution('https://ifyoumind.com/?utm_source=instagram&utm_medium=organic_social&utm_campaign=property_tax_carousel_v2&utm_content=bio&email=private@example.com&gclid=secret', ''), { campaign_source: 'instagram', campaign_medium: 'organic_social', campaign_name: 'property_tax_carousel_v2', campaign_content: 'bio' }); assert.deepEqual(safeAttribution('/?utm_source=private@example.com&utm_campaign=secret-123&utm_term=bill', ''), {}); assert.deepEqual(safeAttribution('/', 'https://www.google.com/search?q=private+question'), { campaign_source: 'google', campaign_medium: 'organic' }); });
test('no initialization or events while pending/denied; no preconsent backlog', async () => { let calls = 0; const { t, events } = fixture(async () => { calls++; return true; }); t.page('/'); assert.equal(t.event('free_tax_example_viewed', {}), false); t.consent(false); await flush(); assert.equal(calls, 0); assert.deepEqual(events, []); t.consent(true); await flush(); assert.equal(calls, 1); assert.deepEqual(events.map(e => e.name), ['page_view']); });
test('consent before initial SPA navigation initializes once on successful route', async () => { let count = 0; const { t, events } = fixture(async () => { count++; return true; }); t.consent(true); assert.equal(count, 0); t.page('/pricing?private=secret'); await flush(); assert.equal(count, 1); assert.equal(events[0].params.page_location, 'https://ifyoumind.com/pricing'); });
test('single page view on grant, navigation and redirects; query-only changes dedupe', async () => { const { t, events } = fixture(); t.page('/'); t.consent(true); await flush(); t.page('/'); t.page('/?example=tax#business'); t.page('/pricing'); t.page('/pricing?checkout=success&projectId=private'); t.page('/'); assert.deepEqual(events.map(e => e.params.page_location), ['https://ifyoumind.com/', 'https://ifyoumind.com/pricing', 'https://ifyoumind.com/']); assert.equal(events[1].params.page_referrer, 'https://ifyoumind.com/'); });
test('different saved decisions count separate screens without exposing IDs', async () => { const { t, events } = fixture(); t.page('/decisions/PrivateOne'); t.consent(true); await flush(); t.page('/decisions/PrivateTwo?email=secret'); assert.equal(events.length, 2); assert.ok(events.every(e => e.params.page_location === 'https://ifyoumind.com/decisions/detail')); assert.doesNotMatch(JSON.stringify(events), /Private|secret/); });
test('example/evidence dedupe and sanitized context on same screen', async () => { const { t, events } = fixture(); t.page('/?question=private'); t.consent(true); await flush(); assert.equal(t.event('free_tax_example_viewed', {}, 'tax'), true); assert.equal(t.event('free_tax_example_viewed', {}, 'tax'), false); t.event('evidence_revealed', { example: 'tax' }, 'evidence'); assert.equal(events.length, 3); assert.doesNotMatch(JSON.stringify(events), /question|private/); });
test('revocation drops queued events even if delayed script finishes', async () => { let finish; const { t, events } = fixture(() => new Promise(r => finish = r)); t.page('/'); t.consent(true); t.event('registration_completed', { method: 'email' }); t.consent(false); finish(true); await flush(); assert.deepEqual(events, [{ stop: true }]); assert.equal(t.event('purchase_verified', { offer: 'report' }), false); });
test('blocked provider and rejected loader fail without affecting product', async () => { for (const start of [async () => false, async () => { throw Error('blocked'); }]) {
    const { t, events } = fixture(start);
    t.page('/');
    t.consent(true);
    await flush();
    t.event('free_tax_example_viewed');
    assert.deepEqual(events, []);
} });
test('private/unrecognized routes reject all custom events', async () => { const { t, events } = fixture(); t.page('/'); t.consent(true); await flush(); t.page('/discover/?bill=private'); assert.equal(t.event('evidence_revealed', { example: 'tax' }), false); assert.equal(events.length, 1); });
test('Checkout URL identifiers stay local and reject other origins/paths', () => { assert.equal(checkoutSessionFromUrl('https://checkout.stripe.com/g/pay/cs_live_abc#fragment'), 'cs_live_abc'); for (const u of ['https://evil.com/c/pay/cs_live_abc', 'https://checkout.stripe.com.evil/c/pay/cs_live_abc', 'http://checkout.stripe.com/c/pay/cs_live_abc'])
    assert.equal(checkoutSessionFromUrl(u), null); });
test('purchase proof waits for successful tag readiness and is dropped on revoke/failure', async () => { for (const state of ['ready', 'revoked', 'failed']) {
    let finish, count = 0;
    const { t } = fixture(() => new Promise(r => finish = r));
    t.page('/pricing');
    t.consent(true);
    t.afterReady(() => count++);
    assert.equal(count, 0);
    if (state === 'revoked')
        t.consent(false);
    finish(state !== 'failed');
    await flush();
    assert.equal(count, state === 'ready' ? 1 : 0);
} });
test('provider send/stop exceptions never interrupt the product', async () => { const t = new AcquisitionTracker({ start: async () => true, send: () => { throw Error('provider'); }, stop: () => { throw Error('provider'); } }); t.page('/'); t.consent(true); await flush(); assert.doesNotThrow(() => t.event('free_tax_example_viewed', {})); assert.doesNotThrow(() => t.consent(false)); });
test('regrant resumes exactly one current page view without backfilling withdrawn events', async () => { const { t, events } = fixture(); t.page('/privacy-policy'); t.consent(true); await flush(); t.consent(false); t.consent(true); await flush(); assert.equal(events.filter(e => e.name === 'page_view').length, 2); });
