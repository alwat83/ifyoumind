import { JourneyNavigationComponent } from '../journey-navigation.component';
import { CommonModule } from '@angular/common';
import { Component, DestroyRef, NgZone, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { CheckoutOffer, CommercialStatus, MonetizationService } from './monetization.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { MarketIntelligenceService } from './market-intelligence.service';

@Component({
  selector:'app-pricing',
  standalone:true,
  imports:[JourneyNavigationComponent,CommonModule,RouterLink],
  templateUrl:'./pricing.component.html',
  styleUrls:['./pricing.component.scss'],
})
export class PricingComponent implements OnInit {
  private readonly organizations=inject(OrganizationService);
  private readonly monetization=inject(MonetizationService);
  private readonly route=inject(ActivatedRoute);
  private readonly analytics=inject(ProductAnalyticsService);
  private readonly market=inject(MarketIntelligenceService);
  private readonly auth=inject(Auth);
  private readonly destroyRef=inject(DestroyRef);
  private readonly zone=inject(NgZone);
  private viewerUid: string | null | undefined;

  workspace:IntelligenceOrganization|null=null;
  status:CommercialStatus|null=null;
  loading=true;
  requesting='';
  message='';
  projectId='';
  highlightedOffer='';
  reportReady=false;
  error='';
  signedIn=false;
  readonly subscriptionPlans = [
    { offer: 'starter' as const, name: 'Starter', price: '4.99', allowance: '1 full Decision Report' },
    { offer: 'plus' as const, name: 'Plus', price: '9.99', allowance: '3 full Decision Reports' },
  ];

  ngOnInit():void{
    this.destroyRef.onDestroy(() => { this.viewerUid = undefined; });
    user(this.auth).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(viewer => this.zone.run(() => {
      const uid = viewer?.emailVerified ? viewer.uid : null;
      if (this.viewerUid === uid) return;
      this.viewerUid = uid;
      this.signedIn = uid !== null;
      this.workspace = null;
      this.status = null;
      this.reportReady = false;
      this.projectId = '';
      this.highlightedOffer = '';
      this.requesting = '';
      this.message = '';
      this.error = '';
      this.loading = uid !== null;
      if (uid) void this.loadPricing(uid);
    }));
  }

  private async loadPricing(uid: string):Promise<void>{
    this.projectId=this.route.snapshot.queryParamMap.get('projectId')||'';
    this.highlightedOffer=this.route.snapshot.queryParamMap.get('offer')||'';
    const checkout=this.route.snapshot.queryParamMap.get('checkout')||'';

    if(checkout==='success'){
      this.message='Checkout returned successfully. Checking your access…';
    }
    if(checkout==='cancelled') this.message=this.highlightedOffer==='report'
      ? 'Checkout was cancelled. You can return to your decision or check the existing Checkout attempt again.'
      : 'Checkout was cancelled. You can return to your decision or try again.';

    try{
      const workspace=await this.organizations.getMyWorkspace();
      if (this.viewerUid !== uid) return;
      this.workspace=workspace;
      if(this.workspace){
        void this.analytics.track(this.workspace.organizationId,'pricing_view',{
          offer:this.highlightedOffer||'none',
        });
        if(checkout==='success') void this.analytics.track(this.workspace.organizationId,'checkout_success',{offer:this.highlightedOffer||'unknown'});
        if(checkout==='cancelled') void this.analytics.track(this.workspace.organizationId,'checkout_cancelled',{offer:this.highlightedOffer||'unknown'});
        const status=await this.monetization.status(this.workspace.organizationId);
        if (this.viewerUid !== uid) return;
        this.status=status;
        if(checkout==='success'&&this.highlightedOffer==='report'&&this.projectId){
          const project=await this.market.get(this.workspace.organizationId,this.projectId);
          if (this.viewerUid !== uid) return;
          this.reportReady=project.decisionReportPurchased===true;
          this.message=this.reportReady
            ? project.decisionReportGenerationRequired
              ? 'Your payment is complete. Open your decision to prepare the full report.'
              : 'Your payment is complete. Your Decision Report is unlocked.'
            : 'Report access is still being confirmed. Refresh this page to check access before trying again.';
        }else if(checkout==='success'&&this.highlightedOffer==='pro'){
          this.message=this.status.plan==='pro'
            ? 'Pro is active. Your access has been updated.'
            : 'Your checkout returned successfully. Pro access is still being confirmed. Refresh this page shortly.';
        }
      }
    }catch(error){if(this.viewerUid===uid)this.error=this.messageFor(error);}
    finally{if(this.viewerUid===uid)this.loading=false;}
  }

  get checkingReportReturn():boolean{
    return this.highlightedOffer==='report'&&this.route.snapshot.queryParamMap.get('checkout')==='success';
  }

  get showMonthlyPlans():boolean{
    return this.status?.subscriptionOffers === true && !this.status.subscription?.linked && this.status.plan !== 'pro';
  }

  async request(offer:Exclude<CheckoutOffer,'pro'>):Promise<void>{
    const uid=this.viewerUid;
    if(!uid||this.auth.currentUser?.uid!==uid||!this.auth.currentUser.emailVerified||!this.workspace||this.requesting)return;

    if(!this.projectId){
      this.error='Start or open a decision first, then purchase its Decision Report.';
      return;
    }

    this.requesting=offer;
    this.message='';
    this.error='';

    try{
      if(this.status?.checkoutEnabled){
        void this.analytics.track(this.workspace.organizationId,'checkout_started',{offer});
        const url=await this.monetization.checkout(
          this.workspace.organizationId,
          offer,
          this.projectId,
        );
        if(this.viewerUid!==uid)return;
        if(!url) throw new Error('Checkout did not return a payment URL.');
        window.location.assign(url);
        return;
      }

      if(offer==='starter'||offer==='plus') throw new Error('Subscription checkout is currently unavailable.');
      const message=await this.monetization.requestAccess(
        this.workspace.organizationId,
        offer,
        'Decision report interest for project '+this.projectId,
      );
      if(this.viewerUid===uid)this.message=message;
    }catch(error){
      if(this.viewerUid!==uid)return;
      this.error=this.messageFor(error);
      this.requesting='';
    }
  }

  private messageFor(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
