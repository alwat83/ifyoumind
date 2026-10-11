import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganizationService } from './organization.service';
import { DecisionReportPayload, MarketIntelligenceService, MarketProject } from './market-intelligence.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { CommercialStatus, MonetizationService } from './monetization.service';

@Component({
  selector:'app-market-report',
  standalone:true,
  imports:[CommonModule,RouterLink],
  templateUrl:'./market-report.component.html',
  styleUrls:['./market-report.component.scss'],
})
export class MarketReportComponent implements OnInit {
  private readonly route=inject(ActivatedRoute);
  private readonly organizations=inject(OrganizationService);
  private readonly market=inject(MarketIntelligenceService);
  private readonly analytics=inject(ProductAnalyticsService);
  private readonly monetization=inject(MonetizationService);

  project:MarketProject|null=null;
  status:CommercialStatus|null=null;
  organizationId='';
  loading=true;
  unlocking=false;
  unlockError='';
  error='';

  get decisionReport():DecisionReportPayload|null{
    if(!this.reportPurchased)return null;
    const report=this.project?.brief?.decisionReport;
    if(!report)return null;
    return {
      ...report,
      decisionTriggers:{
        ...report.decisionTriggers,
        strengthens:'Verified local demand plus acceptable occupancy costs would strengthen the case.',
      },
    };
  }

  get reportPurchased():boolean{
    return this.project?.decisionReportPurchased===true||this.project?.decisionReportAccess==='pro';
  }

  get canUnlockWithPro():boolean{
    return !this.reportPurchased&&this.status?.plan==='pro'&&(this.status?.remainingIncludedReports??0)>0;
  }

  get proAllowanceUsedUp():boolean{
    return !this.reportPurchased&&this.status?.plan==='pro'&&(this.status?.remainingIncludedReports??0)<=0;
  }

  async unlockWithPro():Promise<void>{
    if(!this.project||!this.organizationId||this.unlocking)return;
    this.unlocking=true;
    this.unlockError='';
    try{
      await this.monetization.unlockReportWithPro(this.organizationId,this.project.id);
      [this.project,this.status]=await Promise.all([
        this.market.get(this.organizationId,this.project.id),
        this.monetization.status(this.organizationId),
      ]);
    }catch(error){this.unlockError=this.message(error);}
    finally{this.unlocking=false;}
  }

  get recommendation():string{
    const brief=this.project?.brief;
    if(!brief)return '';
    const support=brief.opportunities.length;
    const caution=brief.risks.length;
    if(support>caution)return 'The available evidence leans favorable, with important items to validate before committing.';
    if(caution>support)return 'The available evidence suggests caution. Resolve the major risks before committing.';
    return 'The evidence is mixed. Treat this as a validation decision rather than a clear go/no-go.';
  }

  get confidenceLabel():string{
    const brief=this.project?.brief;
    if(!brief)return 'Building';
    const sourced=brief.metrics.filter(metric=>!!metric.sourceLabel).length;
    if(this.project?.mode==='live'&&sourced>=Math.max(2,Math.ceil(brief.metrics.length*.75)))return 'High source coverage';
    if(sourced>0)return 'Moderate source coverage';
    return 'Limited source coverage';
  }

  get evidenceSummary():string{
    const brief=this.project?.brief;
    if(!brief)return '';
    const sourced=brief.metrics.filter(metric=>!!metric.sourceLabel).length;
    return `${sourced} of ${brief.metrics.length} key metrics include source attribution.`;
  }

  async ngOnInit():Promise<void>{
    try{
      const workspace=await this.organizations.getMyWorkspace();
      if(!workspace) throw new Error('Workspace not found.');
      const projectId=this.route.snapshot.paramMap.get('projectId');
      if(!projectId) throw new Error('Market project not found.');
      this.organizationId=workspace.organizationId;
      [this.project,this.status]=await Promise.all([
        this.market.get(workspace.organizationId,projectId),
        this.monetization.status(workspace.organizationId).catch(()=>null),
      ]);
      void this.analytics.track(workspace.organizationId,'report_view',{
        paid:this.project.decisionReportPurchased?'yes':this.project.decisionReportAccess==='pro'?'pro':'no',
      });
    }catch(error){this.error=this.message(error);}
    finally{this.loading=false;}
  }

  printReport():void{
    window.print();
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
