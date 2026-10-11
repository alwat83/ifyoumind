import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CookiePreferencesService } from '../services/cookie-preferences.service';

@Component({
  selector:'app-public-landing',
  standalone:true,
  imports:[CommonModule,RouterLink],
  templateUrl:'./public-landing.component.html',
  styleUrls:['./public-landing.component.scss'],
})
export class PublicLandingComponent {
  private readonly cookiePreferences=inject(CookiePreferencesService);

  openCookieSettings(event:Event):void{
    event.preventDefault();
    this.cookiePreferences.open();
  }
}
