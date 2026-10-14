import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CookiePreferencesService } from '../../services/cookie-preferences.service';
import { CookieService, ConsentStatus } from '../../services/cookie.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-cookie-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cookie-preferences.component.html',
  styleUrls: ['./cookie-preferences.component.scss']
})
export class CookiePreferencesComponent {
  private cookiePreferencesService = inject(CookiePreferencesService);
  private cookieService = inject(CookieService);

  isOpen$ = this.cookiePreferencesService.isOpen$;

  consent: ConsentStatus = {
    essential: true,
    analytics: false,
    functional: false,
    marketing: false
  };

  constructor() {
    // Re-read the stored choice each time the panel opens, so it never shows a stale state.
    this.isOpen$.subscribe(open => {
      if (open) this.consent = { ...this.cookieService.getConsentStatus() };
    });
  }

  close() {
    this.cookiePreferencesService.close();
  }

  save() {
    this.cookieService.updateConsent(this.consent);
    this.close();
  }

  acceptAll() {
    this.consent = { essential: true, analytics: true, functional: false, marketing: false };
    this.save();
  }

  rejectAll() {
    this.consent = { essential: true, analytics: false, functional: false, marketing: false };
    this.save();
  }
}
