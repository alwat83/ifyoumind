import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { CommercialStatus, MonetizationService } from './monetization.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { MarketIntelligenceService } from './market-intelligence.service';

@Component({
  selector:'app-pricing',
  standalone:true,
  imports:[CommonModule,RouterLink],
  templateUrl:'./pricing.component.html',
  styleUrls:['./pricing.component.scss'],
})
export class PricingComponent implements OnInit {
  private readonly organizations=inject(OrganizationService);
  private readonly monetization=inject(MonetizationService);
  private readonly route=inject(ActivatedRoute);
  private readonly analytics=inject(ProductAnalyticsService);
  private readonly market=inject(MarketIntelligenceService);

  workspace:IntelligenceOrganization|null=null;
  status:CommercialStatus|null=null;
  loading=true;
  requesting='';
  message='';
  projectId='';
  highlightedOffer='';
  reportReady=false;
  error='';

  async ngOnInit():Promise<void>{
    this.projectId=this.route.snapshot.queryParamMap.get('projectId')||'';
    this.highlightedOffer=this.route.snapshot.queryParamMap.get('offer')||'';
    const checkout=this.route.snapshot.queryParamMap.get('checkout')||'';

    if(checkout==='success'){
      this.message='Checkout returned successfully. Checking your access…';
    }
    if(checkout==='cancelled') this.message='Checkout was cancelled. Nothing was charged.';

    try{
      this.workspace=await this.organizations.getMyWorkspace();
      if(this.workspace){
        void this.analytics.track(this.workspace.organizationId,'pricing_view',{
          offer:this.highlightedOffer||'none',
        });
        if(checkout==='success') void this.analytics.track(this.workspace.organizationId,'checkout_success',{offer:this.highlightedOffer||'unknown'});
        if(checkout==='cancelled') void this.analytics.track(this.workspace.organizationId,'checkout_cancelled',{offer:this.highlightedOffer||'unknown'});
        this.status=await this.monetization.status(this.workspace.organizationId);
        if(checkout==='success'&&this.highlightedOffer==='report'&&this.projectId){
          const project=await this.market.get(this.workspace.organizationId,this.projectId);
          this.reportReady=project.decisionReportPurchased===true;
          this.message=this.reportReady
            ? 'Your payment is complete. Your Decision Report is unlocked.'
            : 'Your checkout returned successfully. Report access is still being confirmed. Refresh this page shortly.';
        }else if(checkout==='success'&&this.highlightedOffer==='pro'){
          this.message=this.status.plan==='pro'
            ? 'Pro is active. Your access has been updated.'
            : 'Your checkout returned successfully. Pro access is still being confirmed. Refresh this page shortly.';
        }
      }
    }catch(error){this.error=this.messageFor(error);}
    finally{this.loading=false;}
  }

  async request(offer:'pro'|'report'):Promise<void>{
    if(!this.workspace||this.requesting)return;

    if(offer==='report'&&!this.projectId){
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
        if(!url) throw new Error('Checkout did not return a payment URL.');
        window.location.assign(url);
        return;
      }

      this.message=await this.monetization.requestAccess(
        this.workspace.organizationId,
        offer,
        offer==='pro'
          ? 'Pricing page Pro interest'
          : 'Decision report interest for project '+this.projectId,
      );
    }catch(error){
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
