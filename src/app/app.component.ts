import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AnalyticsBootstrapService } from './analytics/analytics-bootstrap.service';
import { CookieConsentBannerComponent } from './components/cookie-consent-banner/cookie-consent-banner.component';
import { CookiePreferencesComponent } from './components/cookie-preferences/cookie-preferences.component';
import { PageMetaService } from './seo/page-meta.service';

@Component({
  selector:'app-root',
  standalone:true,
  imports:[RouterOutlet,CookieConsentBannerComponent,CookiePreferencesComponent],
  templateUrl:'./app.component.html',
  styleUrl:'./app.component.scss',
})
export class AppComponent {
  constructor(){
    inject(PageMetaService).start();
    inject(AnalyticsBootstrapService).start();
  }
}
