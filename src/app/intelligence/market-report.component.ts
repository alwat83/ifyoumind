import { SiteFooterComponent } from '../site-footer.component';
import { JourneyNavigationComponent } from '../journey-navigation.component';
import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Auth, user } from '@angular/fire/auth';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganizationService } from './organization.service';
import { DecisionReportPayload, MarketIntelligenceService, MarketProject, ReportExplanation } from './market-intelligence.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { CommercialStatus, MonetizationService } from './monetization.service';
import { MarketAnalysisComponent } from './market-analysis.component';
import { clearIntent, parseIntent, readIntent } from '../purchase-intent';
import { EvidenceSummary, housingTakeaway, summarizeEvidence } from './evidence-summary';
import { loadSampleBeforeDeadline, SampleLoadFailure, sampleFailureCopy } from './sample-report-loading';
import { understandCityQuestion } from './decision-steps';
import { buildCityDecisionCase, CityDecisionCase } from './city-decision-case';

@Component({
  selector:'app-market-report',
  standalone:true,
  imports:[SiteFooterComponent,CommonModule,RouterLink,MarketAnalysisComponent,JourneyNavigationComponent],
  templateUrl:'./market-report.component.html',
  styleUrls:['./market-report.component.scss','./market-report-offers.component.scss','./market-report-findings.component.scss','./market-report-mobile.component.scss','./sample-report-state.component.scss'],
})
export class MarketReportComponent implements OnInit, OnDestroy {
  private readonly route=inject(ActivatedRoute);
  private readonly organizations=inject(OrganizationService);
  private readonly market=inject(MarketIntelligenceService);
  private readonly analytics=inject(ProductAnalyticsService);
  private readonly monetization=inject(MonetizationService);

  /** Public sample at /sample-report: full report, no account, no purchase UI. */
  readonly sampleMode=this.route.snapshot.data['sample']===true;
  private readonly sampleUser=this.sampleMode?toSignal(user(inject(Auth))):undefined;
  /** Header and footer account state: private reports are signed in; the public sample follows Auth. */
  readonly navAccount=computed(():'Account'|'Sign In'=>!this.sampleMode||this.sampleUser?.()?'Account':'Sign In');
  readonly sampleEntry=computed(()=>{
    const account=this.sampleUser?.();
    if(account===undefined)return null;
    return account
      ? { path:'/decide', free:{type:'business'}, report:{type:'business',intent:'report'} }
      : { path:'/register', free:null, report:{intent:'report'} };
  });

  project:MarketProject|null=null;
  status:CommercialStatus|null=null;
  organizationId='';
  loading=true;
  unlocking=false;
  unlockError='';
  checkingSubscription=false;
  explaining=false;
  explanation:ReportExplanation|null=null;
  explanationError='';
  checkoutReturned=false;
  error='';
  sampleFailure:{title:string;detail:string}|null=null;
  sampleCanRetry=false;
  private sampleAttempts=0;
  private sampleController:AbortController|null=null;
  private destroyed=false;
  private focusRecoveredReport=false;
  private evidenceProject?: MarketProject;
  private evidenceCase?: CityDecisionCase;
  private evidenceBrief?: MarketProject['brief'];
  readonly focusDecisionTitle=(inject(Location).getState() as { focusDecisionTitle?: boolean } | null)?.focusDecisionTitle === true;

  @ViewChild('reportTitle') set reportTitle(title:ElementRef<HTMLElement>|undefined){
    if(title&&(this.focusRecoveredReport||this.focusDecisionTitle)){
      this.focusRecoveredReport=false;
      title.nativeElement.focus();
    }
  }
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
    return !this.project?.decisionReportGenerationRequired &&
      (this.project?.decisionReportPurchased===true||this.project?.decisionReportAccess==='pro');
  }

  get canUnlockWithPro():boolean{
    return !this.reportPurchased&&!this.canGeneratePaidReport&&this.status?.plan==='pro'&&(this.status?.remainingIncludedReports??0)>0;
  }

  /** Only for unpaid decisions: Pro members with allowance left see the existing unlock button instead. */
  get showPurchasePrompt():boolean{
    return !this.sampleMode&&this.purchaseIntent&&!this.reportPurchased&&!this.canUnlockWithPro&&!this.canGeneratePaidReport&&!this.status?.subscriptionOffers;
  }

  get proAllowanceUsedUp():boolean{
    return !this.reportPurchased&&this.status?.plan==='pro'&&(this.status?.remainingIncludedReports??0)<=0;
  }

  get canGeneratePaidReport():boolean{
    if(this.sampleMode||!this.project||this.reportPurchased)return false;
    return (this.project.decisionReportGenerationRequired === true &&
      (this.project.decisionReportPurchased === true || this.project.decisionReportAccess === 'pro')) ||
      (this.status?.subscription?.remaining??0)>0;
  }

  async explainReport():Promise<void>{
    if(this.sampleMode||!this.project?.reportExplanationAvailable||!this.organizationId||this.explaining)return;
    this.explaining=true;
    this.explanationError='';
    const organizationId=this.organizationId,projectId=this.project.id;
    try{
      const result=await this.market.explainReport(organizationId,projectId);
      if(!this.destroyed&&this.organizationId===organizationId&&this.project?.id===projectId)this.explanation=result;
    }
    catch{if(!this.destroyed&&this.project?.id===projectId)this.explanationError='The explanation is unavailable. Your verified report and access are unchanged.';}
    finally{this.explaining=false;}
  }

  async refreshSubscription():Promise<void>{
    if(!this.organizationId||this.checkingSubscription)return;
    this.checkingSubscription=true;
    this.unlockError='';
    try{
      this.status=await this.monetization.status(this.organizationId);
    }catch(error){this.unlockError=this.message(error);}
    finally{this.checkingSubscription=false;}
  }

  async generatePaidReport():Promise<void>{
    if(!this.project||!this.organizationId||this.unlocking)return;
    this.unlocking=true;
    this.unlockError='';
    try{
      await this.monetization.generatePaidReport(this.organizationId,this.project.id);
      [this.project,this.status]=await Promise.all([
        this.market.get(this.organizationId,this.project.id),this.monetization.status(this.organizationId),
      ]);
    }catch(error){this.unlockError=this.message(error);}
    finally{this.unlocking=false;}
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
  get cityEvidence(): CityDecisionCase | undefined {
    const project = this.project;
    const brief = project?.brief;
    if (this.sampleMode || this.reportPurchased || project?.mode !== 'live' || !brief || !(brief.comparisons?.length || project.comparisonLocations?.length)) return undefined;
    if (project !== this.evidenceProject) {
      this.evidenceProject = project;
      this.evidenceCase = buildCityDecisionCase({ location: project.location, metrics: brief.metrics }, brief.comparisons ?? [],
        this.householdQuestion?.intent === 'cost-of-living' ? 'personal-living-cost' : 'city-comparison');
      const { primary, places, calculations } = this.evidenceCase;
      const paired = new Set(calculations.map(calculation => calculation.other.id));
      this.evidenceBrief = { ...brief, metrics: primary?.metrics ?? [],
        comparisons: places.filter(item => item !== primary).flatMap(place => {
          const metrics = place.metrics.filter(metric => paired.has(metric.id));
          return metrics.length ? [{ ...place, metrics }] : [];
        }) };
    }
    return this.evidenceCase;
  }

  get visibleBrief() {
    return this.cityEvidence ? this.evidenceBrief : this.project?.brief;
  }

  get summary():EvidenceSummary|null{
    const brief=this.visibleBrief;
    if(!brief||!this.project)return null;
    const primary={location:this.project.location,metrics:brief.metrics||[]};
    const summary=summarizeEvidence(primary,brief.comparisons||[]);
    const context=this.householdQuestion;
    const evidence = this.cityEvidence;
    if (evidence && !evidence.calculations.length) return { ...summary,
      headline: 'A verified city comparison is unavailable.',
      limits: evidence.primary
        ? 'This saved decision has no matching verified estimates for the requested cities.'
        : 'This saved decision has no verified estimates for the main city.' };
    if (evidence && context && !evidence.calculations.some(calculation => calculation.primary.key === 'homeValue')) {
      return { ...summary, headline: 'A verified home-value comparison is unavailable.',
        limits: 'The available estimates cannot establish personal housing expenses or a salary equivalent.' };
    }
    return context ? {
      ...summary,
      headline:housingTakeaway(primary, evidence
        ? brief.comparisons.find(place => place.metrics.some(metric => metric.key === 'homeValue'))
        : brief.comparisons?.[0]),
      limits:context.intent==='cost-of-living'
        ? 'These Census estimates describe each city’s population, household income, and home values. To compare your cost of living or calculate a salary equivalent, you’d need actual housing, taxes, transportation, and other recurring expenses.'
        : 'Median home value describes what owner-occupied homes are worth. To estimate what you would pay, check current rent or sale listings, financing, utilities, and fees for comparable homes.',
    } : summary;
  }

  get householdQuestion() {
    if (this.sampleMode || this.project?.mode !== 'live' || typeof this.project.decision !== 'string') return null;
    const parsed = understandCityQuestion(this.project.decision);
    return parsed.intent === 'cost-of-living' || parsed.intent === 'housing' ? parsed : null;
  }

  get reportedSalary(): string {
    const amount=this.householdQuestion?.annualSalary;
    return amount ? new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2}).format(amount) : '';
  }

  get nextQuestions(): string[] {
    const intent=this.householdQuestion?.intent;
    if(intent==='cost-of-living') return [
      'What would comparable housing cost you in each place, including utilities and fees?',
      'What would you pay for taxes, transportation, and your other recurring expenses in each place?',
    ];
    if(intent==='housing') return ['What are comparable homes listing for in the neighborhoods you would consider?'];
    return this.project?.brief?.questions ?? [];
  }

  /** How many key figures cite their source. This counts citations; it is not a confidence score. */
  get sourcesCited():string{
    const brief=this.visibleBrief;
    if(!brief)return '';
    const sourced=brief.metrics.filter(metric=>!!metric.sourceLabel).length;
    if (this.cityEvidence) return `${sourced} of 3 main-city figures`;
    return `${sourced} of ${brief.metrics.length} key figures`;
  }


  async ngOnInit():Promise<void>{
    if(this.sampleMode){
      await this.loadSample();
      return;
    }
    this.checkoutReturned=this.route.snapshot.queryParamMap.get('subscription')==='confirming';
    try{
      // A shared finding may belong to another workspace where this user is an active viewer.
      // Resolve that membership on the server; never overwrite the user's own workspace index.
      const sharedWorkspace=this.route.snapshot.queryParamMap.get('organizationId');
      const workspace=sharedWorkspace
        ? await this.organizations.getWorkspace(sharedWorkspace)
        : await this.organizations.getMyWorkspace();
      if(!workspace) throw new Error('Workspace not found.');
      const projectId=this.route.snapshot.paramMap.get('projectId');
      if(!projectId) throw new Error('Market project not found.');
      this.organizationId=workspace.organizationId;
      [this.project,this.status]=await Promise.all([
        this.market.get(workspace.organizationId,projectId),
        this.monetization.status(workspace.organizationId).catch(()=>null),
      ]);
      if(this.checkoutReturned&&this.status?.subscription?.offer)void this.monetization.confirmAnalyticsPurchase(workspace.organizationId,projectId,this.status.subscription.offer);
      this.purchaseIntent=parseIntent(this.route.snapshot.queryParamMap.get('intent'))==='report'||readIntent()==='report';
      clearIntent();
      void this.analytics.track(workspace.organizationId,'report_view',{
        paid:this.project.decisionReportPurchased?'yes':this.project.decisionReportAccess==='pro'?'pro':'no',
      });
    }catch(error){this.error=this.message(error);}
    finally{this.loading=false;}
  }

  async loadSample():Promise<void>{
    if(!this.sampleMode||this.sampleController||this.destroyed)return;
    const controller=new AbortController();
    this.sampleController=controller;
    this.loading=true;
    this.sampleAttempts++;
    try{
      const project=await loadSampleBeforeDeadline(()=>{
        if(!navigator.onLine)throw new SampleLoadFailure('offline');
        return this.market.sample();
      },controller.signal);
      if(this.destroyed)return;
      this.focusRecoveredReport=this.sampleCanRetry;
      this.project=project;
      this.sampleFailure=null;
    }catch(error){
      if(this.destroyed)return;
      // Keep the original SDK error/code/stack for developer diagnostics, never public copy.
      console.error('[ifYouMind] Public sample report failed.',error);
      this.sampleFailure=sampleFailureCopy(error,!navigator.onLine,this.sampleAttempts>1);
      this.sampleCanRetry=true;
    }finally{
      this.sampleController=null;
      if(!this.destroyed)this.loading=false;
    }
  }

  @HostListener('window:offline') sampleWentOffline():void{
    this.sampleController?.abort('offline');
  }

  ngOnDestroy():void{
    this.destroyed=true;
    this.sampleController?.abort('cancelled');
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
