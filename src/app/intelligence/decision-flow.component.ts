import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { OrganizationService } from './organization.service';
import { MarketIntelligenceService } from './market-intelligence.service';

type DecisionType='business'|'compare'|'growth'|'custom';

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

  step=1;
  type:DecisionType='business';
  location='';
  comparisonInput='';
  concept='';
  decision='';
  working=false;
  error='';

  ngOnInit():void{
    const type=this.route.snapshot.queryParamMap.get('type');
    if(type==='business'||type==='compare'||type==='growth'){
      this.type=type;
      this.applyDefaults();
      this.step=2;
      return;
    }
    this.applyDefaults();
  }

  chooseType(type:DecisionType):void{
    this.type=type;
    this.applyDefaults();
    this.step=2;
  }

  next():void{if(this.step<4)this.step++;}
  back():void{if(this.step>1)this.step--;}

  async analyze():Promise<void>{
    if(this.working||!this.location.trim())return;
    this.working=true; this.error='';
    try{
      let workspace=await this.organizations.getMyWorkspace();
      if(!workspace){
        await this.organizations.createWorkspace('My ifYouMind');
        workspace=await this.organizations.getMyWorkspace();
      }
      if(!workspace) throw new Error('Could not create your workspace.');

      const comparisons=this.comparisonInput.split(';').map(v=>v.trim()).filter(Boolean).slice(0,3);
      const project=await this.market.create(
        workspace.organizationId,
        this.location.trim(),
        this.concept.trim()||this.defaultConcept(),
        this.decision.trim()||this.defaultDecision(),
        comparisons,
      );
      await this.router.navigate(['/app/result',project.id]);
    }catch(error){this.error=this.message(error);}
    finally{this.working=false;}
  }

  private applyDefaults():void{
    if(this.type==='business'){
      this.concept='Fast-casual restaurant';
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
