import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookiePreferencesService } from '../services/cookie-preferences.service';
import { AnalyticsBootstrapService } from '../analytics/analytics-bootstrap.service';

@Component({
  selector:'app-public-landing',
  standalone:true,
  imports:[CommonModule,RouterLink],
  templateUrl:'./public-landing.component.html',
  styleUrls:['./public-landing.component.scss','./public-landing-offers.component.scss'],
})
export class PublicLandingComponent {
  private readonly cookiePreferences=inject(CookiePreferencesService);
  private readonly funnel=inject(AnalyticsBootstrapService);

  cta(name:string):void{this.funnel.track('cta_click',{cta:name});}

  openCookieSettings(event:Event):void{
    event.preventDefault();
    this.cookiePreferences.open();
  }
}
