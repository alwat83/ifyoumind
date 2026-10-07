import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { CommercialStatus, MonetizationService } from './monetization.service';

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

  workspace:IntelligenceOrganization|null=null;
  status:CommercialStatus|null=null;
  loading=true;
  requesting='';
  message='';
  projectId='';
  highlightedOffer='';
  error='';

  async ngOnInit():Promise<void>{
    this.projectId=this.route.snapshot.queryParamMap.get('projectId')||'';
    this.highlightedOffer=this.route.snapshot.queryParamMap.get('offer')||'';
    const checkout=this.route.snapshot.queryParamMap.get('checkout')||'';

    if(checkout==='success') this.message='Payment confirmed. Your access is being updated now.';
    if(checkout==='cancelled') this.message='Checkout was cancelled. Nothing was charged.';

    try{
      this.workspace=await this.organizations.getMyWorkspace();
      if(this.workspace) this.status=await this.monetization.status(this.workspace.organizationId);
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
