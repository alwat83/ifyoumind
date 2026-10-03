import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IntelligenceOrganization, OrganizationService } from './organization.service';
import { MarketIntelligenceService, MarketProject } from './market-intelligence.service';

@Component({
  selector:'app-consumer-home',
  standalone:true,
  imports:[CommonModule,RouterLink],
  templateUrl:'./consumer-home.component.html',
  styleUrls:['./consumer-home.component.scss'],
})
export class ConsumerHomeComponent implements OnInit {
  private readonly organizations=inject(OrganizationService);
  private readonly market=inject(MarketIntelligenceService);

  workspace:IntelligenceOrganization|null=null;
  recent:MarketProject[]=[];
  loading=true;
  error='';

  async ngOnInit():Promise<void>{
    try{
      this.workspace=await this.organizations.getMyWorkspace();
      if(!this.workspace){
        await this.organizations.createWorkspace('My ifYouMind');
        this.workspace=await this.organizations.getMyWorkspace();
      }
      if(this.workspace){
        this.recent=await this.market.recent(this.workspace.organizationId);
      }
    }catch(error){this.error=this.message(error);}
    finally{this.loading=false;}
  }

  private message(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
