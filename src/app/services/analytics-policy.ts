/** One allowlisted GA4 destination. No private route/question/report values are accepted. */
// Enable only in the authorized release after stream Enhanced Measurement is verified OFF.
export const GA4_PRODUCTION_ENABLED = false;
export const GA4_ID = 'G-NRT31062LW';
export const GA4_STREAM_ID = '16394318092';
export const ANALYTICS_CONSENT_VERSION = 'ga4-analytics-v1';
export type Example = 'tax' | 'electricity' | 'cities';
export type Offer = 'report' | 'starter' | 'plus';
export type AcquisitionEvent = 'free_tax_example_viewed' | 'free_electricity_example_viewed' | 'evidence_revealed' | 'registration_completed' | 'checkout_started' | 'purchase_verified';
const schemas: Record<AcquisitionEvent, Record<string, readonly string[]>> = {
    free_tax_example_viewed: {}, free_electricity_example_viewed: {},
    evidence_revealed: { example: ['tax', 'electricity', 'cities'] },
    registration_completed: { method: ['email', 'google'] },
    checkout_started: { offer: ['report', 'starter', 'plus'] }, purchase_verified: { offer: ['report', 'starter', 'plus'] },
};
export function safeEvent(name: string, value: unknown): Record<string, string> | null {
    if (!Object.hasOwn(schemas, name) || !value || typeof value !== 'object' || Array.isArray(value))
        return null;
    const schema = schemas[name as AcquisitionEvent], entries = Object.entries(value);
    if (entries.length !== Object.keys(schema).length || entries.some(([k, v]) => !Object.hasOwn(schema, k) || typeof v !== 'string' || !schema[k].includes(v)))
        return null;
    return Object.fromEntries(entries) as Record<string, string>;
}
const pages: Record<string, string> = { '/': 'Explore examples', '/pricing': 'Pricing', '/sample-report': 'Sample report', '/register': 'Create account', '/login': 'Sign in', '/verify-email': 'Verify email', '/privacy-policy': 'Privacy policy', '/terms-of-conduct': 'Terms', '/decide': 'Start a decision', '/decisions': 'Saved decisions', '/account': 'Account', '/data': 'Data', '/ask': 'Ask', '/growth': 'Growth', '/advanced': 'Analysis' };
export function safePage(raw: string): {
    path: string;
    title: string;
} | null {
    const path = raw.split(/[?#]/, 1)[0].replace(/\/+$/, '') || '/';
    if (/^\/decisions\/[A-Za-z0-9_-]{1,128}$/.test(path))
        return { path: '/decisions/detail', title: 'Saved finding' };
    return Object.hasOwn(pages, path) ? { path, title: pages[path] } : null;
}
export function safeAttribution(raw: string, referrer: string): Record<string, string> {
    const q = new URL(raw, 'https://ifyoumind.com').searchParams, result: Record<string, string> = {};
    const allowed: Record<string, readonly string[]> = { utm_source: ['instagram', 'facebook', 'google', 'bing', 'tiktok', 'linkedin', 'newsletter'], utm_medium: ['organic_social', 'social', 'organic', 'referral', 'email', 'cpc'], utm_campaign: ['property_tax_carousel_v2', 'welcome_launch', 'electricity_example', 'city_comparison'], utm_content: ['bio', 'carousel', 'reel_01', 'slide_01', 'slide_02', 'slide_03', 'slide_04', 'slide_05'] };
    for (const [key, values] of Object.entries(allowed)) {
        const value = q.get(key);
        if (value && values.includes(value))
            result[key === 'utm_campaign' ? 'campaign_name' : key.replace('utm_', 'campaign_')] = value;
    }
    if (!result['campaign_source'])
        try {
            const host = new URL(referrer).hostname;
            const source = /^(www\.|l\.|m\.)?instagram\.com$/.test(host) ? 'instagram' : /^(www\.|l\.|m\.|lm\.)?facebook\.com$/.test(host) ? 'facebook' : /^(www\.)?google\.(com|co\.uk|ca|com\.au)$/.test(host) ? 'google' : null;
            if (source) {
                result['campaign_source'] = source;
                result['campaign_medium'] = source === 'google' ? 'organic' : 'organic_social';
            }
        }
        catch { }
    return result;
}
export interface AnalyticsPort {
    start(page: Record<string, unknown>): Promise<boolean>;
    send(name: string, params: Record<string, unknown>): void;
    stop(): void;
}
export class AcquisitionTracker {
    private allowed = false;
    private ready = false;
    private epoch = 0;
    private lastPath = '';
    private current: {
        path: string;
        title: string;
    } | null = null;
    private pending: Array<{
        name: string;
        params: Record<string, unknown>;
    }> = [];
    private once = new Set<string>();
    private previous = '';
    private currentReferrer = '';
    private currentRaw = '';
    constructor(private port: AnalyticsPort, private attribution: Record<string, string> = {}) { }
    get enabled(): boolean { return this.allowed; }
    private starting = false;
    private readyActions: Array<() => void> = [];
    afterReady(action: () => void): void { if (!this.allowed)
        return; if (this.ready)
        action();
    else if (this.readyActions.length < 8)
        this.readyActions.push(action); }
    page(raw: string): void {
        this.currentRaw = raw;
        this.current = safePage(raw);
        const key = raw.split(/[?#]/, 1)[0];
        if (!this.allowed || !this.current || key === this.lastPath)
            return;
        if (!this.starting) {
            this.starting = true;
            const epoch = this.epoch;
            void this.port.start(this.common()).then(ok => { if (epoch !== this.epoch || !this.allowed)
                return; if (!ok) {
                this.pending = [];
                this.readyActions = [];
                return;
            } this.ready = true; const pending = this.pending; this.pending = []; for (const e of pending)
                this.deliver(e); const actions = this.readyActions; this.readyActions = []; for (const action of actions) {
                try {
                    action();
                }
                catch { }
            } }).catch(() => { if (epoch === this.epoch) {
                this.pending = [];
                this.readyActions = [];
            } });
        }
        this.lastPath = key;
        this.once.clear();
        this.currentReferrer = this.previous;
        this.dispatch('page_view', {});
        this.previous = 'https://ifyoumind.com' + this.current.path;
    }
    consent(granted: boolean): void {
        if (granted === this.allowed)
            return;
        this.allowed = granted;
        ++this.epoch;
        if (!granted) {
            this.ready = false;
            this.starting = false;
            this.pending = [];
            this.readyActions = [];
            this.once.clear();
            this.lastPath = '';
            this.previous = '';
            this.currentReferrer = '';
            try {
                this.port.stop();
            }
            catch { }
            return;
        }
        if (this.current)
            this.page(this.currentRaw);
    }
    event(name: string, params: unknown = {}, key?: string): boolean {
        if (!this.allowed || !this.current)
            return false;
        const clean = safeEvent(name, params);
        if (!clean)
            return false;
        if (key && this.once.has(key))
            return false;
        if (key)
            this.once.add(key);
        this.dispatch(name, clean);
        return true;
    }
    private deliver(event: {
        name: string;
        params: Record<string, unknown>;
    }): void { try {
        this.port.send(event.name, event.params);
    }
    catch { /* Measurement must not break the product. */ } }
    private common(): Record<string, unknown> { return { send_to: GA4_ID, page_location: 'https://ifyoumind.com' + (this.current?.path || '/'), page_title: this.current?.title || 'ifYouMind', page_referrer: this.currentReferrer, ...this.attribution }; }
    private dispatch(name: string, params: Record<string, unknown>): void { const event = { name, params: { ...this.common(), ...params } }; if (this.ready)
        this.deliver(event);
    else if (this.pending.length < 32)
        this.pending.push(event); }
}
export function checkoutSessionFromUrl(raw: string): string | null { try {
    const u = new URL(raw);
    const id = u.pathname.split('/').at(-1) || '';
    return u.origin === 'https://checkout.stripe.com' && /^\/(c|g)\/pay\/cs_(live|test)_[A-Za-z0-9]+$/.test(u.pathname) ? id : null;
}
catch {
    return null;
} }
