import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface CommercialStatus {
  plan:'free'|'pro';
  planName:string;
  usedMarketProjects:number;
  marketProjectsPerMonth:number;
  comparisonMarkets:number;
  remainingMarketProjects:number;
  checkoutEnabled:boolean;
  pricing:{proMonthlyUsd:number;reportOneTimeUsd:number};
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
    offer:'pro'|'report',
    projectId='',
  ):Promise<string>{
    const call=httpsCallable<
      {organizationId:string;offer:'pro'|'report';projectId:string},
      {url:string;sessionId:string}
    >(this.functions,'createCommercialCheckout');
    return (await call({organizationId,offer,projectId})).data.url;
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
