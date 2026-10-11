import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';

interface GtagConsentParams {
  ad_storage?: 'granted' | 'denied';
  analytics_storage?: 'granted' | 'denied';
  functionality_storage?: 'granted' | 'denied';
  security_storage?: 'granted' | 'denied';
  personalization_storage?: 'granted' | 'denied';
}

declare const gtag: (command: 'consent', action: 'default' | 'update', parameters: GtagConsentParams) => void;

const CONSENT_STORAGE_KEY = 'ifyoumind_cookie_consent';

export interface ConsentStatus {
  essential: boolean;
  analytics: boolean;
  functional: boolean;
  marketing: boolean;
}

/** A stored choice that is missing, unreadable or malformed counts as "not answered yet". */
function parseConsent(raw: string | null): ConsentStatus | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== 'object' || typeof value.analytics !== 'boolean') return null;
    return { essential: true, analytics: value.analytics, functional: false, marketing: false };
  } catch {
    return null;
  }
}

@Injectable({
  providedIn: 'root'
})
export class CookieService {
  private consentStatus = new BehaviorSubject<ConsentStatus | null>(null);
  public consentStatus$ = this.consentStatus.asObservable();
  private isBrowser: boolean;
  private platformId = inject(PLATFORM_ID);

  constructor() {
    this.isBrowser = isPlatformBrowser(this.platformId);
    this.loadConsentStatus();
  }

  private loadConsentStatus() {
    if (this.isBrowser) {
      let storedConsent: string | null = null;
      try { storedConsent = localStorage.getItem(CONSENT_STORAGE_KEY); } catch { /* storage blocked */ }
      const consent = parseConsent(storedConsent);
      if (consent) {
        this.consentStatus.next(consent);
        this.updateGoogleConsentMode(consent);
      } else {
        this.consentStatus.next(null); // Pending
      }
    }
  }

  /** ifYouMind only uses analytics cookies; no functional or advertising cookies are set. */
  public acceptAll(): void {
    const consent: ConsentStatus = { essential: true, analytics: true, functional: false, marketing: false };
    this.updateConsent(consent);
  }

  public rejectAll(): void {
    const consent: ConsentStatus = { essential: true, analytics: false, functional: false, marketing: false };
    this.updateConsent(consent);
  }

  public updateConsent(consent: ConsentStatus): void {
    if (this.isBrowser) {
      try { localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent)); } catch { /* storage blocked: choice lasts this visit */ }
      this.consentStatus.next(consent);
      this.updateGoogleConsentMode(consent);
    }
  }

  public getConsentStatus(): ConsentStatus {
    return this.consentStatus.getValue() || { essential: true, analytics: false, functional: false, marketing: false };
  }

  public hasConsent(category: keyof ConsentStatus): boolean {
    const status = this.getConsentStatus();
    return status[category];
  }

  public needsConsent(): boolean {
    return this.consentStatus.getValue() === null;
  }

  private updateGoogleConsentMode(consent: ConsentStatus): void {
    if (typeof gtag === 'function') {
      gtag('consent', 'update', {
        'ad_storage': consent.marketing ? 'granted' : 'denied',
        'analytics_storage': consent.analytics ? 'granted' : 'denied',
        'functionality_storage': consent.functional ? 'granted' : 'denied',
        'security_storage': 'granted', // Always granted
        'personalization_storage': consent.marketing ? 'granted' : 'denied'
      });
    }
  }
}
