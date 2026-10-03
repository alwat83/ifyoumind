import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  workspace:IntelligenceOrganization|null=null;
  status:CommercialStatus|null=null;
  loading=true;
  requesting='';
  message='';
  error='';

  async ngOnInit():Promise<void>{
    try{
      this.workspace=await this.organizations.getMyWorkspace();
      if(this.workspace) this.status=await this.monetization.status(this.workspace.organizationId);
    }catch(error){this.error=this.messageFor(error);}
    finally{this.loading=false;}
  }

  async request(offer:'pro'|'report'):Promise<void>{
    if(!this.workspace||this.requesting)return;
    this.requesting=offer; this.message=''; this.error='';
    try{
      this.message=await this.monetization.requestAccess(
        this.workspace.organizationId,
        offer,
        offer==='pro'?'Pricing page Pro interest':'Pricing page one-time report interest',
      );
    }catch(error){this.error=this.messageFor(error);}
    finally{this.requesting='';}
  }

  private messageFor(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
