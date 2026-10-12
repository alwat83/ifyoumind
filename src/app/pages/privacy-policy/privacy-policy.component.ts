import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookiePreferencesService } from '../../services/cookie-preferences.service';

@Component({
  selector:'app-privacy-policy',
  standalone:true,
  imports:[RouterLink],
  templateUrl:'./privacy-policy.component.html',
  styleUrl:'./privacy-policy.component.scss',
})
export class PrivacyPolicyComponent {
  private readonly cookiePreferences=inject(CookiePreferencesService);
  effectiveDate='October 2, 2026';
  lastUpdated='October 11, 2026';
  contactEmail='privacy@ifyoumind.com';

  openCookieSettings():void{this.cookiePreferences.open();}
}
