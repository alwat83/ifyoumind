import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface ProductFunnelMetrics{
  days:number;
  generatedAt:string;
  counts:Record<string,number>;
  uniqueOrganizations:Record<string,number>;
  conversion:{
    appToDecision:number;
    decisionToPricing:number;
    pricingToCheckout:number;
    checkoutToPaid:number;
  };
}

@Injectable({providedIn:'root'})
export class GrowthMetricsService{
  private readonly functions=inject(Functions);
  async get(days=30):Promise<ProductFunnelMetrics>{
    const call=httpsCallable<{days:number},ProductFunnelMetrics>(
      this.functions,'getProductFunnelMetrics'
    );
    return (await call({days})).data;
  }
}
