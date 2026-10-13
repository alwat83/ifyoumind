import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { redirectIfUnverified } from '../auth/email-verification';

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
  pricing:{proMonthlyUsd:number;reportOneTimeUsd:number;proIncludedReportsPerMonth?:number};
}

@Injectable({providedIn:'root'})
export class MonetizationService {
  private readonly functions=inject(Functions);
  private readonly router=inject(Router);

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
    return (await redirectIfUnverified(this.router, () => call({organizationId,offer,projectId}))).data.url;
  }

  async unlockReportWithPro(organizationId:string,projectId:string):Promise<number>{
    const call=httpsCallable<
      {organizationId:string;projectId:string},
      {unlocked:boolean;remainingIncludedReports:number}
    >(this.functions,'unlockDecisionReportWithPro');
    return (await redirectIfUnverified(this.router, () => call({organizationId,projectId}))).data.remainingIncludedReports;
  }

  async billingPortal(organizationId:string):Promise<string>{
    const call=httpsCallable<{organizationId:string},{url:string}>(
      this.functions,'createBillingPortalSession'
    );
    return (await redirectIfUnverified(this.router, () => call({organizationId}))).data.url;
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
    return (await redirectIfUnverified(this.router, () => call({organizationId,offer,context}))).data.message;
  }
}
