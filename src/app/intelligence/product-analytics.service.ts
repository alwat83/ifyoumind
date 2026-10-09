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

  async track(
    organizationId:string,
    event:ProductEvent,
    context:Record<string,string>={},
  ):Promise<void>{
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
