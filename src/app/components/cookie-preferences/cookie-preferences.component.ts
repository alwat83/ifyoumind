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
    this.consent = this.cookieService.getConsentStatus();
  }

  close() {
    this.cookiePreferencesService.close();
  }

  save() {
    this.cookieService.updateConsent(this.consent);
    this.close();
  }

  acceptAll() {
    this.consent = { essential: true, analytics: true, functional: true, marketing: true };
    this.save();
  }

  rejectAll() {
    this.consent = { essential: true, analytics: false, functional: false, marketing: false };
    this.save();
  }
}
