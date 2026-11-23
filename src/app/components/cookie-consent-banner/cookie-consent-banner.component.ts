import { Component, DestroyRef, ElementRef, PLATFORM_ID, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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

  private host = inject(ElementRef<HTMLElement>);
  private destroy = inject(DestroyRef);
  private resize?: ResizeObserver;

  @ViewChild('banner') set banner(value: ElementRef<HTMLElement> | undefined) {
    this.resize?.disconnect();
    this.host.nativeElement.style.height = '0px';
    if (!value || !isPlatformBrowser(this.platformId)) return;
    // Reserve the fixed banner's actual height so bottom-of-page controls remain reachable.
    const reserve = () => this.host.nativeElement.style.height = `${value.nativeElement.getBoundingClientRect().height}px`;
    reserve();
    this.resize = new ResizeObserver(reserve);
    this.resize.observe(value.nativeElement);
  }

  constructor() {
    this.destroy.onDestroy(() => this.resize?.disconnect());
    if (isPlatformBrowser(this.platformId)) {
      this.cookieService.consentStatus$.pipe(takeUntilDestroyed()).subscribe(() => this.showBanner = this.cookieService.needsConsent());
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
  }
}
