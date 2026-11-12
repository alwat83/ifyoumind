import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export type SubscriptionOffer = 'starter'|'plus';
export type CheckoutOffer = 'pro'|'report'|SubscriptionOffer;

export interface CommercialStatus {
  plan:'free'|'pro';
  planName:string;
  usedMarketProjects:number;
  marketProjectsPerMonth:number;
  comparisonMarkets:number;
  remainingMarketProjects:number;
  includedReportsPerMonth:number;
  usedIncludedReports:number;
  remainingIncludedReports:number;
  checkoutEnabled:boolean;
  paymentsLive?:boolean;
  subscriptionOffers?:boolean;
  subscriptionPortalAvailable?:boolean;
  subscription?:{
    offer:SubscriptionOffer|null;
    pending:boolean;
    linked:boolean;
    state:string|null;
    paidThrough:number|null;
    cancelAt:number|null;
    remaining:number;
  }|null;
  pricing:{proMonthlyUsd:number;reportOneTimeUsd:number;proIncludedReportsPerMonth?:number};
}

@Injectable({providedIn:'root'})
export class MonetizationService {
  private readonly functions=inject(Functions);

  async status(organizationId:string):Promise<CommercialStatus>{
    const call=httpsCallable<{organizationId:string},CommercialStatus>(
      this.functions,'getCommercialStatus'
    );
    return (await call({organizationId})).data;
  }

  async checkout(
    organizationId:string,
    offer:CheckoutOffer,
    projectId='',
  ):Promise<string>{
    const call=httpsCallable<
      {organizationId:string;offer:CheckoutOffer;projectId:string},
      {url:string;sessionId:string}
    >(this.functions,'createCommercialCheckout');
    return (await call({organizationId,offer,projectId})).data.url;
  }

  async unlockReportWithPro(organizationId:string,projectId:string):Promise<number>{
    const call=httpsCallable<
      {organizationId:string;projectId:string},
      {unlocked:boolean;remainingIncludedReports:number}
    >(this.functions,'unlockDecisionReportWithPro');
    return (await call({organizationId,projectId})).data.remainingIncludedReports;
  }

  async generatePaidReport(organizationId:string,projectId:string):Promise<void>{
    const call=httpsCallable<{organizationId:string;projectId:string},{ready:boolean}>(
      this.functions,'generatePaidDecisionReport',{timeout:85_000}
    );
    await call({organizationId,projectId});
  }

  async billingPortal(organizationId:string):Promise<string>{
    const call=httpsCallable<{organizationId:string},{url:string}>(
      this.functions,'createBillingPortalSession'
    );
    return (await call({organizationId})).data.url;
  }

  async requestAccess(
    organizationId:string,
    offer:'pro'|'report',
    context:string,
  ):Promise<string>{
    const call=httpsCallable<
      {organizationId:string;offer:'pro'|'report';context:string},
      {ok:boolean;message:string}
    >(this.functions,'requestCommercialAccess');
    return (await call({organizationId,offer,context})).data.message;
  }
}
