import { isPlatformBrowser } from '@angular/common';
import { Injectable, Injector, PLATFORM_ID, inject } from '@angular/core';
import { Analytics, logEvent, setAnalyticsCollectionEnabled, setConsent } from '@angular/fire/analytics';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CookieService } from '../services/cookie.service';
import { ANALYTICS_CONSENT_GRANTED, analyticsAllowed, analyticsPagePath } from './analytics-consent';

declare const gtag:((command:'set',params:Record<string,string>)=>void)|undefined;

/**
 * Starts Firebase Analytics (GA4) only after the visitor allows analytics cookies, and stops
 * collection if they later withdraw. Until then the gtag script is never requested.
 */
@Injectable({providedIn:'root'})
export class AnalyticsBootstrapService{
  private readonly injector=inject(Injector);
  private readonly cookies=inject(CookieService);
  private readonly router=inject(Router);
  private readonly isBrowser=isPlatformBrowser(inject(PLATFORM_ID));
  private analytics:Analytics|null=null;
  private allowed=false;
  private started=false;

  start():void{
    if(this.started||!this.isBrowser)return;
    this.started=true;
    this.cookies.consentStatus$.subscribe(consent=>{
      const allowed=analyticsAllowed(consent,window.location.hostname);
      this.allowed=allowed;
      if(allowed&&!this.analytics)this.initialize();
      else if(this.analytics)this.setCollection(allowed);
    });
    this.router.events.pipe(filter((event):event is NavigationEnd=>event instanceof NavigationEnd))
      .subscribe(event=>this.pageView(event.urlAfterRedirects));
  }

  private initialize():void{
    try{
      // Consent defaults must be set before Analytics is created; advertising stays denied.
      setConsent({...ANALYTICS_CONSENT_GRANTED});
      this.analytics=this.injector.get(Analytics,null);
      if(!this.analytics)return;
      this.setCollection(true);
      // Before the first navigation finishes, the NavigationEnd handler sends the page view.
      if(this.router.navigated)this.pageView(window.location.pathname+window.location.search);
    }catch(error){
      console.debug('[analytics] not started',error);
    }
  }

  /** Sends a page view with the cleaned path, and makes later hits use the cleaned URL too. */
  private pageView(url:string):void{
    if(!this.analytics||!this.allowed)return;
    const path=analyticsPagePath(url);
    const location=`${window.location.origin}${path}`;
    try{
      if(typeof gtag==='function')gtag('set',{page_location:location,page_path:path});
      logEvent(this.analytics,'page_view',{page_location:location,page_path:path,page_title:document.title});
    }catch{/* never let analytics break the page */}
  }

  private setCollection(enabled:boolean):void{
    if(!this.analytics)return;
    try{setAnalyticsCollectionEnabled(this.analytics,enabled);}catch{/* unsupported browser */}
  }
}
