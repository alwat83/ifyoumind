import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { intentParams, parseIntent, readIntent, rememberIntent } from '../purchase-intent';
import { OrganizationService } from './organization.service';
import { MarketIntelligenceService } from './market-intelligence.service';
import { ProductAnalyticsService } from './product-analytics.service';
import { AnalyticsBootstrapService } from '../analytics/analytics-bootstrap.service';
import { DecisionType, parseComparisons, requiresComparison, stepProgress } from './decision-steps';

@Component({
  selector:'app-decision-flow',
  standalone:true,
  imports:[CommonModule,FormsModule,RouterLink],
  templateUrl:'./decision-flow.component.html',
  styleUrls:['./decision-flow.component.scss'],
})
export class DecisionFlowComponent implements OnInit {
  private readonly route=inject(ActivatedRoute);
  private readonly router=inject(Router);
  private readonly organizations=inject(OrganizationService);
  private readonly market=inject(MarketIntelligenceService);
  private readonly analytics=inject(ProductAnalyticsService);
  private readonly funnel=inject(AnalyticsBootstrapService);

  step=1;
  startStep=1;
  type:DecisionType='business';
  location='';
  comparisonInput='';
  concept='';
  decision='';
  working=false;
  error='';

  ngOnInit():void{
    rememberIntent(parseIntent(this.route.snapshot.queryParamMap.get('intent')));
    const type=this.route.snapshot.queryParamMap.get('type');
    if(type==='business'||type==='compare'||type==='growth'){
      this.type=type;
      this.applyDefaults();
      this.step=2;
      this.startStep=2;
      return;
    }
    this.applyDefaults();
  }

  chooseType(type:DecisionType):void{
    this.type=type;
    this.applyDefaults();
    this.step=2;
  }

  next():void{if(this.step<3)this.step++;}
  back():void{if(this.step>1)this.step--;}

  get progress():{current:number;total:number}{return stepProgress(this.step,this.startStep);}
  get comparisonCount():number{return parseComparisons(this.comparisonInput).length;}
  get needsComparison():boolean{return requiresComparison(this.type);}
  get canContinueFromPlace():boolean{
    return !!this.location.trim()&&(!this.needsComparison||this.comparisonCount>0);
  }

  async analyze():Promise<void>{
    if(this.working||!this.canContinueFromPlace)return;
    this.working=true; this.error='';
    try{
      let workspace=await this.organizations.getMyWorkspace();
      if(!workspace){
        await this.organizations.createWorkspace('My ifYouMind');
        workspace=await this.organizations.getMyWorkspace();
      }
      if(!workspace) throw new Error('Could not create your workspace.');

      const comparisons=parseComparisons(this.comparisonInput);
      const project=await this.market.create(
        workspace.organizationId,
        this.location.trim(),
        this.concept.trim()||this.defaultConcept(),
        this.decision.trim()||this.defaultDecision(),
        comparisons,
      );
      void this.analytics.track(workspace.organizationId,'decision_created',{
        type:this.type,
        comparisons:String(comparisons.length),
      });
      this.funnel.track('decision_created',{decision_type:this.type,comparisons:comparisons.length});
      await this.router.navigate(['/app/result',project.id],{queryParams:intentParams({},readIntent())});
    }catch(error){this.error=this.message(error);}
    finally{this.working=false;}
  }

  private applyDefaults():void{
    if(this.type==='business'){
      // Left blank so the brief is written for the visitor's own business, not a placeholder one.
      this.concept='';
      this.decision='Should I open this business here?';
    }else if(this.type==='compare'){
      this.concept='Location comparison';
      this.decision='Which location looks stronger for this decision?';
    }else if(this.type==='growth'){
      this.concept='Market growth';
      this.decision='Is this area growing in a healthy way?';
    }else{
      this.concept='';
      this.decision='What does the data suggest?';
    }
  }

  private defaultConcept():string{return this.type==='growth'?'Market growth':'Location decision';}
  private defaultDecision():string{return this.type==='growth'?'Is this area growing?':'What does the data suggest?';}

  private message(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
