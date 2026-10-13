import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { redirectIfUnverified } from '../auth/email-verification';

export interface PaymentTotals{
  payments:number;
  reports:number;
  pro:number;
  grossByCurrency:Record<string,number>;
}

export interface ConfirmedPayment{
  paidAt:string|null;
  offer:'report'|'pro'|null;
  amountTotal:number|null;
  currency:string|null;
  organizationId:string|null;
  checkoutSessionId:string|null;
  fulfilment:string|null;
}

export interface ProductFunnelMetrics{
  days:number;
  generatedAt:string;
  counts:Record<string,number>;
  uniqueOrganizations:Record<string,number>;
  confirmedPayments?:{live:PaymentTotals;test:PaymentTotals;recentLive:ConfirmedPayment[]};
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
  private readonly router=inject(Router);
  async get(days=30):Promise<ProductFunnelMetrics>{
    const call=httpsCallable<{days:number},ProductFunnelMetrics>(
      this.functions,'getProductFunnelMetrics'
    );
    return (await redirectIfUnverified(this.router, () => call({days}))).data;
  }
}
