import { CookieService } from '../services/cookie.service';
import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export type ProductEvent=
  |'app_open'
  |'decision_created'
  |'report_view'
  |'pricing_view'
  |'checkout_started'
  |'checkout_success'
  |'checkout_cancelled'
  |'billing_portal_opened';

@Injectable({providedIn:'root'})
export class ProductAnalyticsService {
  private readonly functions=inject(Functions);
  private readonly cookies=inject(CookieService);

  async track(
    organizationId:string,
    event:ProductEvent,
    context:Record<string,string>={},
  ):Promise<void>{
    // Existing first-party product telemetry is optional too; never forward its tenant/user context to GA4.
    if(!this.cookies.hasConsent('analytics'))return;
    try{
      const call=httpsCallable<
        {organizationId:string;event:ProductEvent;context:Record<string,string>},
        {ok:boolean}
      >(this.functions,'recordProductEvent');
      await call({organizationId,event,context});
    }catch(error){
      console.warn('Product analytics event was not recorded.',event);
    }
  }
}
