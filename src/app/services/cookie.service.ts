import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { ANALYTICS_CONSENT_VERSION } from './analytics-policy';
const KEY = 'ifyoumind_cookie_consent';
export interface ConsentStatus {
    essential: boolean;
    analytics: boolean;
    functional: boolean;
    marketing: boolean;
}
const denied = (): ConsentStatus => ({ essential: true, analytics: false, functional: false, marketing: false });
@Injectable({ providedIn: 'root' })
export class CookieService {
    private subject = new BehaviorSubject<ConsentStatus | null>(null);
    readonly consentStatus$ = this.subject.asObservable();
    private browser = isPlatformBrowser(inject(PLATFORM_ID));
    constructor() { if (!this.browser)
        return; this.load(); window.addEventListener('storage', e => { if (e.key === KEY)
        this.load(); }); }
    private load(): void { let choice: ConsentStatus | null = null; try {
        const raw = JSON.parse(localStorage.getItem(KEY) || 'null');
        if (raw?.version === ANALYTICS_CONSENT_VERSION && typeof raw.analytics === 'boolean' && Number.isFinite(raw.at) && Date.now() - raw.at >= 0 && Date.now() - raw.at < 180 * 86400000)
            choice = { ...denied(), analytics: raw.analytics };
    }
    catch { } this.subject.next(choice); }
    acceptAll(): void { this.updateConsent({ ...denied(), analytics: true }); }
    rejectAll(): void { this.updateConsent(denied()); }
    updateConsent(value: ConsentStatus): void { if (!this.browser)
        return; const consent = { ...denied(), analytics: value.analytics === true }; try {
        localStorage.setItem(KEY, JSON.stringify({ version: ANALYTICS_CONSENT_VERSION, analytics: consent.analytics, at: Date.now() }));
    }
    catch { /* Choice still applies to this page without persistence. */ } this.subject.next(consent); }
    getConsentStatus(): ConsentStatus { return this.subject.value ?? denied(); }
    hasConsent(category: keyof ConsentStatus): boolean { return this.getConsentStatus()[category]; }
    needsConsent(): boolean { return this.subject.value === null; }
}
