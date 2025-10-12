import { Component, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
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
export class CookieConsentBannerComponent {
  public showBanner = false;

  private cookieService = inject(CookieService);
  private cookiePreferencesService = inject(CookiePreferencesService);
  private platformId = inject(PLATFORM_ID);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.showBanner = this.cookieService.needsConsent();
    }
  }

  acceptAll() {
    this.cookieService.acceptAll();
    this.showBanner = false;
  }

  declineAll() {
    this.cookieService.rejectAll();
    this.showBanner = false;
  }

  manage() {
    this.cookiePreferencesService.open();
    this.showBanner = false;
  }
}
