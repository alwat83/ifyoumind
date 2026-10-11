import { isPlatformBrowser } from '@angular/common';
import { Injectable, Injector, PLATFORM_ID, inject } from '@angular/core';
import { Analytics, ScreenTrackingService, logEvent, setAnalyticsCollectionEnabled, setConsent } from '@angular/fire/analytics';
import { CookieService } from '../services/cookie.service';
import { ANALYTICS_CONSENT_GRANTED, FunnelEvent, analyticsAllowed } from './analytics-consent';

/**
 * Starts Firebase Analytics (GA4) only after the visitor allows analytics cookies, and stops
 * collection if they later withdraw. Until then the gtag script is never requested.
 */
@Injectable({providedIn:'root'})
export class AnalyticsBootstrapService{
  private readonly injector=inject(Injector);
  private readonly cookies=inject(CookieService);
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
  }

  private initialize():void{
    try{
      // Consent defaults must be set before Analytics is created; advertising stays denied.
      setConsent({...ANALYTICS_CONSENT_GRANTED});
      this.analytics=this.injector.get(Analytics,null);
      if(!this.analytics)return;
      this.injector.get(ScreenTrackingService,null);
      this.setCollection(true);
    }catch(error){
      console.debug('[analytics] not started',error);
    }
  }

  /** Sends a funnel event only when the visitor has allowed analytics; otherwise does nothing. */
  track(event:FunnelEvent,params:Record<string,string|number>={}):void{
    if(!this.analytics||!this.allowed)return;
    try{logEvent(this.analytics,event as string,params);}catch{/* never let analytics break the page */}
  }

  private setCollection(enabled:boolean):void{
    if(!this.analytics)return;
    try{setAnalyticsCollectionEnabled(this.analytics,enabled);}catch{/* unsupported browser */}
  }
}
