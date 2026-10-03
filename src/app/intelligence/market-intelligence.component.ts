import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { MarketIntelligenceService, MarketProject } from './market-intelligence.service';
import { CommercialStatus, MonetizationService } from './monetization.service';

@Component({
  selector:'app-market-intelligence',
  standalone:true,
  imports:[CommonModule,FormsModule,RouterLink],
  templateUrl:'./market-intelligence.component.html',
  styleUrls:['./market-intelligence.component.scss'],
})
export class MarketIntelligenceComponent implements OnInit {
  private readonly organizations=inject(OrganizationService);
  private readonly market=inject(MarketIntelligenceService);
  private readonly monetization=inject(MonetizationService);

  workspace:IntelligenceOrganization|null=null;
  recent:MarketProject[]=[];
  project:MarketProject|null=null;
  commercial:CommercialStatus|null=null;
  location='Birmingham, AL';
  concept='Fast-casual seafood restaurant';
  decision='Should I open this concept in this market?';
  comparisonInput='Hoover, AL; Homewood, AL; Vestavia Hills, AL';
  loading=true;
  creating=false;
  creatingWorkspace=false;
  error='';

  async ngOnInit():Promise<void>{
    try{
      this.workspace=await this.organizations.getMyWorkspace();
      if(this.workspace) {
        [this.recent,this.commercial]=await Promise.all([
          this.market.recent(this.workspace.organizationId),
          this.monetization.status(this.workspace.organizationId),
        ]);
      }
    }catch(error){this.error=this.message(error);}
    finally{this.loading=false;}
  }

  async createWorkspace():Promise<void>{
    if(this.creatingWorkspace)return;
    this.creatingWorkspace=true; this.error='';
    try{
      await this.organizations.createWorkspace('My ifYouMind Workspace');
      this.workspace=await this.organizations.getMyWorkspace();
    }catch(error){this.error=this.message(error);}
    finally{this.creatingWorkspace=false;}
  }

  async analyzeMarket():Promise<void>{
    if(!this.workspace||!this.location.trim()||!this.concept.trim()||this.creating)return;
    this.creating=true; this.error='';
    try{
      const comparisonLocations=this.comparisonInput
        .split(';')
        .map(value=>value.trim())
        .filter(Boolean)
        .slice(0,this.commercial?.comparisonMarkets ?? 3);
      this.project=await this.market.create(
        this.workspace.organizationId,
        this.location.trim(),
        this.concept.trim(),
        this.decision.trim()||'Evaluate this market',
        comparisonLocations,
      );
      [this.recent,this.commercial]=await Promise.all([
        this.market.recent(this.workspace.organizationId),
        this.monetization.status(this.workspace.organizationId),
      ]);
    }catch(error){this.error=this.message(error);}
    finally{this.creating=false;}
  }

  formatMetric(value:number,unit:string):string{
    if(unit==='USD') return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
    if(unit==='%') return `${value}%`;
    return new Intl.NumberFormat('en-US').format(value);
  }

  private message(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
