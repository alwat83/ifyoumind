import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganizationService } from './organization.service';
import { DecisionReportPayload, MarketIntelligenceService, MarketProject } from './market-intelligence.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { CommercialStatus, MonetizationService } from './monetization.service';
import { MarketAnalysisComponent } from './market-analysis.component';
import { clearIntent, parseIntent, readIntent } from '../purchase-intent';
import { EvidenceSummary, summarizeEvidence } from './evidence-summary';

@Component({
  selector:'app-market-report',
  standalone:true,
  imports:[CommonModule,RouterLink,MarketAnalysisComponent],
  templateUrl:'./market-report.component.html',
  styleUrls:['./market-report.component.scss','./market-report-offers.component.scss','./market-report-findings.component.scss'],
})
export class MarketReportComponent implements OnInit {
  private readonly route=inject(ActivatedRoute);
  private readonly organizations=inject(OrganizationService);
  private readonly market=inject(MarketIntelligenceService);
  private readonly analytics=inject(ProductAnalyticsService);
  private readonly monetization=inject(MonetizationService);

  /** Public sample at /sample-report: full report, no account, no purchase UI. */
  readonly sampleMode=this.route.snapshot.data['sample']===true;

  project:MarketProject|null=null;
  status:CommercialStatus|null=null;
  organizationId='';
  loading=true;
  unlocking=false;
  unlockError='';
  error='';
  /** Set when the visitor came from the sample wanting the $79 report. */
  purchaseIntent=false;

  get decisionReport():DecisionReportPayload|null{
    if(!this.reportPurchased)return null;
    const report=this.project?.brief?.decisionReport;
    if(!report)return null;
    if(report.schemaVersion>=2)return report;
    return {
      ...report,
      decisionTriggers:{
        ...report.decisionTriggers,
        strengthens:'Verified local demand plus acceptable occupancy costs would strengthen the case.',
      },
    };
  }

  /** Header label: the public sample is the $79 report; unpaid decisions are a free brief. */
  get reportLabel():string{
    if(this.sampleMode)return 'Decision Report · Sample';
    if(this.reportPurchased)return 'Decision Report';
    return 'Decision Brief';
  }

  get reportPurchased():boolean{
    if(this.sampleMode)return true;
    return this.project?.decisionReportPurchased===true||this.project?.decisionReportAccess==='pro';
  }

  get canUnlockWithPro():boolean{
    return !this.reportPurchased&&this.status?.plan==='pro'&&(this.status?.remainingIncludedReports??0)>0;
  }

  /** Only for unpaid decisions: Pro members with allowance left see the existing unlock button instead. */
  get showPurchasePrompt():boolean{
    return !this.sampleMode&&this.purchaseIntent&&!this.reportPurchased&&!this.canUnlockWithPro;
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

  /**
   * What the figures show, measure by measure. Computed from the brief itself, so saved decisions and
   * the sample get it too. It never says favorable or caution: four demographic measures cannot.
   */
  get summary():EvidenceSummary|null{
    const brief=this.project?.brief;
    if(!brief||!this.project)return null;
    return summarizeEvidence({location:this.project.location,metrics:brief.metrics||[]},brief.comparisons||[]);
  }

  /** How many key figures cite their source. This counts citations; it is not a confidence score. */
  get sourcesCited():string{
    const brief=this.project?.brief;
    if(!brief)return '';
    const sourced=brief.metrics.filter(metric=>!!metric.sourceLabel).length;
    return `${sourced} of ${brief.metrics.length} key figures`;
  }


  async ngOnInit():Promise<void>{
    if(this.sampleMode){
      try{this.project=await this.market.sample();}
      catch(error){this.error=this.message(error);}
      finally{this.loading=false;}
      return;
    }
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
      this.purchaseIntent=parseIntent(this.route.snapshot.queryParamMap.get('intent'))==='report'||readIntent()==='report';
      clearIntent();
      void this.analytics.track(workspace.organizationId,'report_view',{
        paid:this.project.decisionReportPurchased?'yes':this.project.decisionReportAccess==='pro'?'pro':'no',
      });
    }catch(error){this.error=this.message(error);}
    finally{this.loading=false;}
  }

  printReport():void{
    window.print();
  }

  /** The formatted value already shows the unit for USD ($) and percentages (%). */
  showUnit(unit:string):boolean{
    return unit!=='USD'&&unit!=='%';
  }

  /** In-page jump links; the app uses a base href, so a bare #fragment would leave the page. */
  jumpTo(event:Event,id:string):void{
    const target=document.getElementById(id);
    if(!target)return;
    event.preventDefault();
    target.scrollIntoView({behavior:'smooth',block:'start'});
    target.setAttribute('tabindex','-1');
    target.focus({preventScroll:true});
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
