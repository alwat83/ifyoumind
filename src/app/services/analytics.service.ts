import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { CookieService } from './cookie.service';
import { AcquisitionTracker, AnalyticsPort, GA4_ID, GA4_PRODUCTION_ENABLED, Offer, safeAttribution } from './analytics-policy';
type GoogleWindow = Window & {
    dataLayer?: IArguments[];
    gtag?: (...args: unknown[]) => void;
    __IFYOUMIND_ANALYTICS_TEST__?: boolean;
    [key: string]: unknown;
};
function browserPort(): AnalyticsPort {
    const w = window as unknown as GoogleWindow;
    let script: HTMLScriptElement | null = null, owned: GoogleWindow['gtag'], loading: Promise<boolean> | null = null;
    return {
        async start(page) {
            if (owned && w.gtag === owned && loading) {
                w['ga-disable-' + GA4_ID] = false;
                return loading;
            }
            if (document.querySelector('script[src*="googletagmanager.com"],iframe[src*="googletagmanager.com"]') || w.gtag)
                return false;
            w['ga-disable-' + GA4_ID] = false;
            w.dataLayer = [];
            owned = function () { w.dataLayer!.push(arguments); };
            w.gtag = owned;
            owned('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
            owned('consent', 'update', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
            owned('set', 'ads_data_redaction', true);
            owned('set', 'url_passthrough', false);
            // Destinations can initialize before the queued config command. Set privacy
            // defaults first so that initialization cannot fall back to document URLs/titles.
            const settings = { ...page, send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false, ignore_referrer: true, cookie_prefix: 'ifym', cookie_expires: 2592000, cookie_update: false, cookie_flags: 'SameSite=Lax;Secure' };
            owned('set', settings);
            owned('js', new Date());
            owned('config', GA4_ID, settings);
            loading = new Promise<boolean>(resolve => { script = document.createElement('script'); script.id = 'ifyoumind-ga4'; script.async = true; script.referrerPolicy = 'no-referrer'; script.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID; script.onload = () => resolve(true); script.onerror = () => resolve(false); document.head.appendChild(script); });
            return loading;
        },
        send(name, params) { if (w['ga-disable-' + GA4_ID] === true || w.gtag !== owned)
            return; owned?.('set', { page_location: params['page_location'], page_title: params['page_title'], page_referrer: params['page_referrer'] }); owned?.('event', name, params); },
        stop() { w['ga-disable-' + GA4_ID] = true; for (const part of document.cookie.split(';')) {
            const name = part.split('=')[0].trim();
            if (!/^(_ga($|_)|ifym_ga($|_))/.test(name))
                continue;
            for (const domain of ['', `; Domain=${location.hostname}`, `; Domain=.${location.hostname}`])
                document.cookie = `${name}=; Max-Age=0; Path=/${domain}; SameSite=Lax`;
        } try {
            sessionStorage.removeItem('ifym_analytics_checkouts');
        }
        catch { } }
    };
}
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
    private router = inject(Router);
    private cookies = inject(CookieService);
    private platform = inject(PLATFORM_ID);
    private tracker: AcquisitionTracker | null = null;
    get permitted(): boolean { return this.tracker?.enabled === true; }
    constructor() {
        if (!isPlatformBrowser(this.platform))
            return;
        // Normal local/emulator use never loads Google; dedicated browser tests mock the tag transport.
        const local = ['localhost', '127.0.0.1'].includes(location.hostname);
        if (!(location.hostname === 'ifyoumind.com' && GA4_PRODUCTION_ENABLED) && !(local && (window as unknown as GoogleWindow).__IFYOUMIND_ANALYTICS_TEST__ === true))
            return;
        this.tracker = new AcquisitionTracker(browserPort(), safeAttribution(location.href, document.referrer));
        if (this.router.navigated)
            this.tracker.page(this.router.url);
        this.router.events.subscribe(e => { if (e instanceof NavigationEnd)
            this.tracker?.page(e.urlAfterRedirects); });
        this.cookies.consentStatus$.subscribe(value => this.tracker?.consent(value?.analytics === true));
    }
    afterReady(action: () => void): void { this.tracker?.afterReady(action); }
    exampleViewed(example: string): void { if (example === 'tax')
        this.tracker?.event('free_tax_example_viewed', {}, 'example:tax'); if (example === 'electricity')
        this.tracker?.event('free_electricity_example_viewed', {}, 'example:electricity'); }
    evidenceRevealed(example: string): void { this.tracker?.event('evidence_revealed', { example }, 'evidence:' + example); }
    registrationCompleted(method: 'email' | 'google'): void { this.tracker?.event('registration_completed', { method }, 'registration'); }
    purchaseVerified(offer: Offer): void { this.tracker?.event('purchase_verified', { offer }); }
    async checkoutStarted(offer: string, sessionId: string): Promise<void> {
        if (!this.permitted || !/^cs_(live|test)_[A-Za-z0-9]+$/.test(sessionId))
            return;
        try {
            const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(sessionId))), b => b.toString(16).padStart(2, '0')).join('');
            if (!this.permitted)
                return;
            const stored = JSON.parse(sessionStorage.getItem('ifym_analytics_checkouts') || '[]') as unknown;
            if (!Array.isArray(stored) || stored.some(v => typeof v !== 'string' || !/^[a-f0-9]{64}$/.test(v)))
                return;
            if (stored.includes(hash))
                return;
            if (this.tracker?.event('checkout_started', { offer }, 'checkout:' + hash))
                sessionStorage.setItem('ifym_analytics_checkouts', JSON.stringify([...stored, hash].slice(-100)));
        }
        catch { /* Analytics never blocks Checkout. */ }
    }
    // Retired idea instrumentation must not forward IDs, errors or arbitrary caller payloads.
    safeLog(_event: string, _params?: unknown): void { }
    ideaUpvoted(_id: string): void { }
    ideaBookmarked(_id: string): void { }
    ideaCreated(_id: string, _category?: string): void { }
    commentAdded(_id: string): void { }
    ideaShared(_id: string, _method: string): void { }
    actionFailed(_action: string, _reason?: string, _context?: unknown): void { }
}
