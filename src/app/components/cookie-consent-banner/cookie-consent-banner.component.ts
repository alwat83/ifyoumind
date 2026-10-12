import { Component, ElementRef, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { CookieService } from '../../services/cookie.service';
import { RouterLink } from '@angular/router';
import { CookiePreferencesService } from '../../services/cookie-preferences.service';

@Component({
  selector: 'app-cookie-consent-banner',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cookie-consent-banner.component.html',
  styleUrls: ['./cookie-consent-banner.component.scss']
})
export class CookieConsentBannerComponent implements OnDestroy {
  public showBanner = false;

  private cookieService = inject(CookieService);
  private cookiePreferencesService = inject(CookiePreferencesService);
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private host = inject(ElementRef<HTMLElement>);
  private resize?: ResizeObserver;

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.showBanner = this.cookieService.needsConsent();
      if (this.showBanner) queueMicrotask(() => this.reserveSpace());
    }
  }

  /**
   * While the banner is open, the page gets matching bottom padding (and scroll padding), so
   * nothing on the page sits underneath it: every button can be scrolled into view and tapped.
   * The banner itself stays fully visible until the visitor chooses.
   */
  private reserveSpace() {
    const banner = (this.host.nativeElement as HTMLElement).querySelector('.cookie-consent-banner') as HTMLElement | null;
    if (!banner || typeof ResizeObserver === 'undefined') return;
    const root = this.document.documentElement;
    const apply = () => {
      const height = `${Math.ceil(banner.getBoundingClientRect().height)}px`;
      root.style.setProperty('--consent-banner-height', height);
      this.document.body.style.paddingBottom = height;
      root.style.scrollPaddingBottom = height;
    };
    apply();
    this.resize = new ResizeObserver(apply);
    this.resize.observe(banner);
  }

  private releaseSpace() {
    this.resize?.disconnect();
    this.resize = undefined;
    if (!isPlatformBrowser(this.platformId)) return;
    const root = this.document.documentElement;
    root.style.removeProperty('--consent-banner-height');
    root.style.scrollPaddingBottom = '';
    this.document.body.style.paddingBottom = '';
  }

  acceptAll() {
    this.cookieService.acceptAll();
    this.close();
  }

  declineAll() {
    this.cookieService.rejectAll();
    this.close();
  }

  manage() {
    this.cookiePreferencesService.open();
    this.close();
  }

  private close() {
    this.showBanner = false;
    this.releaseSpace();
  }

  ngOnDestroy() {
    this.releaseSpace();
  }
}
