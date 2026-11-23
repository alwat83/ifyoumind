import { test, expect, expectAccessible, expectNoHorizontalScroll, signInThroughUi } from '../support/test.mjs';
import { fixtureEmail, newRunId, FIXTURE_PASSWORD, FIXTURES } from '../support/fixtures.mjs';
const KEY = 'ifyoumind_cookie_consent';
async function setup(page, { consent = false, slow = false } = {}) {
    const loads = [];
    loads.calls = [];
    await page.exposeFunction('__qaGaRecord', a => loads.calls.push(a));
    await page.addInitScript(({ KEY, consent }) => { window.__IFYOUMIND_ANALYTICS_TEST__ = true; document.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = '.firebase-emulator-warning{display:none!important}'; document.head.appendChild(style); }); if (consent)
        localStorage.setItem(KEY, JSON.stringify({ version: 'ga4-analytics-v1', analytics: true, at: Date.now() })); }, { KEY, consent });
    await page.route('https://www.googletagmanager.com/**', async (route) => { loads.push(route.request().url()); if (slow)
        await new Promise(r => setTimeout(r, 400)); await route.fulfill({ contentType: 'application/javascript', body: 'window.__gaCalls=Array.from(window.dataLayer||[],a=>Array.from(a));window.__gaCalls.forEach(a=>window.__qaGaRecord(a));const p=window.dataLayer.push.bind(window.dataLayer);window.dataLayer.push=function(a){window.__gaCalls.push(Array.from(a));window.__qaGaRecord(Array.from(a));return p(a);};' }); });
    return loads;
}
const calls = page => page.evaluate(() => window.__gaCalls || []);
const events = async (page, name) => (await calls(page)).filter(c => c[0] === 'event' && (!name || c[1] === name));
test('pending and rejected consent load no Google tag and do not block examples', async ({ page }) => { const loads = await setup(page); await page.goto('/'); await page.getByRole('button', { name: 'Reject analytics', exact: true }).click(); await page.getByRole('button', { name: 'Reveal what changed' }).click(); await expect(page.locator('#discovery-result')).toContainText('$420'); await page.getByText('Show the evidence', { exact: true }).click(); await expect(page.locator('details.home-evidence')).toHaveAttribute('open', ''); expect([...loads]).toEqual([]); expect(await calls(page)).toEqual([]); });
test('one consented destination/page view; example and evidence events are allowlisted and deduplicated', async ({ page }, info) => { const loads = await setup(page); await page.goto('/?utm_source=instagram&utm_medium=organic_social&utm_campaign=property_tax_carousel_v2&email=do-not-send@example.test&question=private-123'); await page.screenshot({ path: `test-results/ga4/consent-${info.project.name}.png`, fullPage: false }); await expectAccessible(page); await expectNoHorizontalScroll(page); await page.getByRole('button', { name: 'Allow analytics', exact: true }).click(); await expect.poll(async () => (await events(page, 'page_view')).length).toBe(1); await page.getByRole('button', { name: 'Reveal what changed' }).click(); await page.getByText('Show the evidence', { exact: true }).click(); await page.getByText('Hide the evidence', { exact: true }).click(); await page.getByText('Show the evidence', { exact: true }).click(); await page.getByRole('button', { name: 'Electricity bills', exact: true }).click(); expect((await events(page, 'free_tax_example_viewed')).length).toBe(1); expect((await events(page, 'free_electricity_example_viewed')).length).toBe(1); expect((await events(page, 'evidence_revealed')).length).toBe(1); expect((await events(page, 'page_view')).length).toBe(1); expect([...loads]).toEqual(['https://www.googletagmanager.com/gtag/js?id=G-NRT31062LW']); const log = await calls(page), config = log.filter(c => c[0] === 'config'); expect(config).toHaveLength(1); expect(config[0][1]).toBe('G-NRT31062LW'); expect(config[0][2].send_page_view).toBe(false); expect(config[0][2].allow_google_signals).toBe(false); expect(log.filter(c => c[0] === 'consent')[0][2].analytics_storage).toBe('denied'); expect(log.filter(c => c[0] === 'consent')[1][2].ad_user_data).toBe('denied'); expect(JSON.stringify(log)).not.toMatch(/do-not-send|private-123|question=|email=|G-DZMLBPS4ZX|GTM-TMM5XMZF/); expect((await events(page, 'page_view'))[0][2].campaign_name).toBe('property_tax_carousel_v2'); await page.screenshot({ path: `test-results/ga4/after-consent-${info.project.name}.png`, fullPage: false }); });
test('SPA navigation, consent withdrawal and regrant do not install another tag', async ({ page }) => { const loads = await setup(page); await page.goto('/'); await page.getByRole('button', { name: 'Allow analytics', exact: true }).click(); await expect.poll(async () => (await events(page, 'page_view')).length).toBe(1); await page.getByRole('link', { name: 'Pricing', exact: true }).last().click(); await expect.poll(async () => (await events(page, 'page_view')).length).toBe(2); await page.goBack(); await expect.poll(async () => (await events(page, 'page_view')).length).toBe(3); await page.getByRole('link', { name: 'Privacy', exact: true }).click(); await expect.poll(async () => (await events(page, 'page_view')).length).toBe(4); await page.getByRole('button', { name: 'Manage analytics preferences' }).click(); await expect(page.getByRole('dialog')).toBeVisible(); await expectAccessible(page); await page.getByRole('button', { name: 'Reject analytics', exact: true }).click(); expect(await page.evaluate(() => window['ga-disable-G-NRT31062LW'])).toBe(true); const before = (await events(page)).length; await page.getByRole('button', { name: 'Manage analytics preferences' }).click(); await page.getByLabel('Allow optional analytics').check(); await page.getByRole('button', { name: 'Save preferences' }).click(); expect(await page.evaluate(() => JSON.parse(localStorage.getItem('ifyoumind_cookie_consent')).analytics)).toBe(true); expect(await page.evaluate(() => window['ga-disable-G-NRT31062LW'])).toBe(false); await expect.poll(async () => (await events(page)).length).toBe(before + 1); expect(loads).toHaveLength(1); });
test('corrupt or legacy consent cannot initialize analytics', async ({ page }) => { const loads = await setup(page); await page.addInitScript(KEY => localStorage.setItem(KEY, '{"essential":true,"analytics":true}'), KEY); await page.goto('/'); await expect(page.getByRole('region', { name: 'Optional analytics' })).toBeVisible(); expect(loads).toHaveLength(0); await page.evaluate(KEY => localStorage.setItem(KEY, '{bad'), KEY); await page.reload(); expect(loads).toHaveLength(0); });
test('an unexpected existing tag fails closed instead of installing duplicates', async ({ page }) => { const loads = await setup(page, { consent: true }); await page.addInitScript(() => { window.gtag = () => { }; }); await page.goto('/'); await page.getByRole('button', { name: 'Reveal what changed' }).click(); expect(loads).toHaveLength(0); expect(await calls(page)).toEqual([]); });
test('registration completed event contains no personal account input', async ({ page, fixtures }) => { await setup(page, { consent: true }); const email = fixtureEmail('T90-ga4-register', newRunId()); fixtures.trackEmail(email); await page.goto('/register'); await expect.poll(async () => (await events(page, 'page_view')).length).toBe(1); await page.getByLabel('Name', { exact: true }).fill('Private Synthetic Name'); await page.getByLabel('Email', { exact: true }).fill(email); await page.getByLabel('Password', { exact: true }).fill(FIXTURE_PASSWORD); await page.getByRole('button', { name: 'Create free account' }).click(); await expect(page).toHaveURL(/verify-email/); await expect.poll(async () => (await events(page, 'registration_completed')).length).toBe(1); expect(JSON.stringify(await calls(page))).not.toContain(email); expect(JSON.stringify(await calls(page))).not.toMatch(/Private Synthetic|password|FIXTURE_PASSWORD/); expect((await events(page, 'registration_completed'))[0][2].method).toBe('email'); });
test('private Discovery remains a separate zero-analytics document after consent', async ({ page }) => { const loads = await setup(page); await page.goto('/'); await page.getByRole('button', { name: 'Allow analytics', exact: true }).click(); await expect.poll(async () => (await events(page, 'page_view')).length).toBe(1); await page.goto('/discover/?example=tax'); await expect(page.getByRole('heading', { name: /\$420|changed|numbers|tax|bill/i }).first()).toBeVisible(); expect(loads).toHaveLength(1); expect(await page.evaluate(() => typeof window.gtag)).toBe('undefined'); expect(await calls(page)).toEqual([]); const existing = await page.evaluate(() => JSON.stringify({ ...localStorage })); await page.getByRole('button', { name: 'Clear & choose another', exact: true }).click(); await expect(page.locator('.finding')).toHaveCount(0); expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(existing);
    const requests = []; page.on('request', r => requests.push(r.url()));
    await page.context().setOffline(true);
    await page.getByRole('button', {name: 'Use a property tax CSV', exact: true}).click();
    await page.getByLabel('Choose a redacted CSV', {exact: true}).setInputFiles({name:'synthetic-private.csv',mimeType:'text/csv',buffer:Buffer.from('tax_year,county_usd,school_usd,municipal_usd,total_usd\n2024,900.00,2400.00,900.00,4200.00\n2025,990.00,2640.00,990.00,4620.00\n')});
    await expect(page.locator('.finding')).toHaveCount(3);
    await page.getByRole('button', {name:'Clear my data',exact:true}).click();
    await expect(page.locator('.finding')).toHaveCount(0);
    expect(requests).toEqual([]);
    expect(await page.evaluate(() => JSON.stringify({ ...localStorage }))).toBe(existing);
    await page.context().setOffline(false); });
test('Checkout attempts reuse one measurement and redirects require server purchase proof', async ({ page, fixtures }) => {
    const loads = await setup(page, { consent: true }), viewer = await fixtures(FIXTURES.FREE_WITH_DECISION, { decisions: 1 }), id = viewer.projectIds[0];
    let confirmed = false, claimed = false, proofCalls = 0;
    const recorded = name => loads.calls.filter(c => c[0] === 'event' && c[1] === name);
    await page.route('**/createCommercialCheckout', route => route.fulfill({ json: { result: { url: 'https://checkout.stripe.com/c/pay/cs_live_GA4Browser', sessionId: 'cs_live_GA4Browser' } } }));
    await page.route('https://checkout.stripe.com/**', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Local unpaid Checkout stub</title><h1>No payment performed</h1>' }));
    await page.route('**/claimVerifiedPurchase', route => { proofCalls++; const ok = confirmed && !claimed; if (ok)
        claimed = true; return route.fulfill({ json: { result: ok ? { confirmed: true, offer: 'report' } : { confirmed: false } } }); });
    const pricing = '/pricing?offer=report&projectId=' + id;
    await signInThroughUi(page, viewer, '/login?returnUrl=' + encodeURIComponent(pricing));
    for (let i = 0; i < 2; i++) {
        if (i)
            await page.goto(pricing);
        await page.getByRole('button', { name: 'Buy Decision Report', exact: true }).click();
        await expect(page).toHaveURL('https://checkout.stripe.com/c/pay/cs_live_GA4Browser');
    }
    await expect.poll(() => recorded('checkout_started').length).toBe(1);
    await page.goto(pricing + '&checkout=success');
    await page.waitForLoadState('networkidle');
    await expect.poll(() => proofCalls).toBe(1);
    expect(recorded('purchase_verified')).toHaveLength(0);
    confirmed = true;
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect.poll(() => recorded('purchase_verified').length).toBe(1);
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect.poll(() => proofCalls).toBe(3);
    expect(recorded('purchase_verified')).toHaveLength(1);
    const wire = JSON.stringify(loads.calls);
    for (const privateValue of [viewer.organizationId, viewer.uid, viewer.email, id, 'cs_live_GA4Browser'])
        expect(wire).not.toContain(privateValue);
});

for (const granted of [true, false]) {
    test(`stored ${granted ? 'granted' : 'rejected'} consent survives SPA navigation and reload`, async ({ page }) => {
        const loads = await setup(page);
        await page.goto('/');
        await page.getByRole('button', { name: granted ? 'Allow analytics' : 'Reject analytics', exact: true }).click();
        await expect(page.getByRole('region', { name: 'Optional analytics' })).toHaveCount(0);
        const choice = await page.evaluate(key => localStorage.getItem(key), KEY);
        await page.getByRole('link', { name: 'Pricing', exact: true }).last().click();
        await expect(page).toHaveURL(/\/pricing$/);
        await expect(page.getByRole('region', { name: 'Optional analytics' })).toHaveCount(0);
        await page.reload();
        await expect(page.getByRole('heading', { name: 'Start free. Go further.' })).toBeVisible();
        await expect(page.getByRole('region', { name: 'Optional analytics' })).toHaveCount(0);
        expect(await page.evaluate(key => localStorage.getItem(key), KEY)).toBe(choice);
        if (granted) {
            await expect.poll(async () => (await events(page, 'page_view')).length).toBe(1);
            expect(loads).toHaveLength(2); // One tag per document, none for the SPA transition.
        } else {
            expect(loads).toHaveLength(0);
            expect(await calls(page)).toEqual([]);
        }
    });
}

test('expired, future-dated and malformed stored permissions require a fresh choice', async ({ page }) => {
    const loads = await setup(page);
    await page.goto('/');
    const values = [
        { version: 'ga4-analytics-v1', analytics: true, at: Date.now() - 181 * 86400000 },
        { version: 'ga4-analytics-v1', analytics: true, at: Date.now() + 86400000 },
        { version: 'ga4-analytics-v1', analytics: 'true', at: Date.now() },
        { version: 'ga4-analytics-v1', analytics: true },
        { version: 'retired-consent', analytics: true, at: Date.now() },
    ];
    for (const value of values) {
        await page.evaluate(({ key, value }) => localStorage.setItem(key, JSON.stringify(value)), { key: KEY, value });
        await page.reload();
        await expect(page.getByRole('region', { name: 'Optional analytics' })).toBeVisible();
        expect(loads).toHaveLength(0);
        expect(await calls(page)).toEqual([]);
    }
});

test('clearing consent in another tab immediately withdraws collection', async ({ page, context }) => {
    await setup(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Allow analytics', exact: true }).click();
    await expect.poll(async () => (await events(page, 'page_view')).length).toBe(1);
    const other = await context.newPage();
    await other.goto('/discover/');
    await other.evaluate(() => localStorage.clear()); // StorageEvent.key is null for clear().
    await expect(page.getByRole('region', { name: 'Optional analytics' })).toBeVisible();
    expect(await page.evaluate(() => window['ga-disable-G-NRT31062LW'])).toBe(true);
    const before = (await events(page)).length;
    await page.getByRole('button', { name: 'Reveal what changed' }).click();
    await expect(page.locator('#discovery-result')).toContainText('$420');
    expect((await events(page)).length).toBe(before);
    await other.close();
});

test('pending consent never obstructs registration, pricing or private Discovery controls', async ({ page }) => {
    const loads = await setup(page);
    await page.goto('/login');
    await page.getByRole('link', { name: 'Create a free account', exact: true }).click();
    await expect(page.getByLabel('Name', { exact: true })).toBeVisible();
    await page.getByLabel('Name', { exact: true }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel('Email', { exact: true })).toBeFocused();
    await expectNoHorizontalScroll(page);
    await page.goto('/pricing');
    await page.getByRole('link', { name: 'Try a free example', exact: true }).click();
    await expect(page).toHaveURL(/\/discover\/\?example=tax/);
    await page.getByRole('button', { name: 'Clear & choose another', exact: true }).click();
    await page.getByRole('button', { name: 'Use a property tax CSV', exact: true }).click();
    await expect(page.getByLabel('Choose a redacted CSV', { exact: true })).toBeFocused();
    expect(loads).toHaveLength(0);
});

test('preferences support keyboard focus, Escape and rejection without collection', async ({ page }) => {
    const loads = await setup(page);
    await page.goto('/');
    await page.getByRole('button', { name: 'Manage', exact: true }).click();
    await expect(page.getByLabel('Allow optional analytics')).toBeFocused();
    await expectAccessible(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Manage', exact: true })).toBeFocused();
    await page.keyboard.press('Enter');
    await page.getByRole('button', { name: 'Reject analytics', exact: true }).last().click();
    await expect(page.getByRole('dialog')).toBeHidden();
    expect(loads).toHaveLength(0);
});
