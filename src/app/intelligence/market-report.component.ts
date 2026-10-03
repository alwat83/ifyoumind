import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { OrganizationService } from './organization.service';
import { MarketIntelligenceService, MarketProject } from './market-intelligence.service';

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

  project:MarketProject|null=null;
  loading=true;
  error='';

  async ngOnInit():Promise<void>{
    try{
      const workspace=await this.organizations.getMyWorkspace();
      if(!workspace) throw new Error('Workspace not found.');
      const projectId=this.route.snapshot.paramMap.get('projectId');
      if(!projectId) throw new Error('Market project not found.');
      this.project=await this.market.get(workspace.organizationId,projectId);
    }catch(error){this.error=this.message(error);}
    finally{this.loading=false;}
  }

  formatMetric(value:number,unit:string):string{
    if(unit==='USD') return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(value);
    if(unit==='%') return `${value}%`;
    return new Intl.NumberFormat('en-US').format(value);
  }

  print():void{window.print();}

  private message(error:unknown):string{
    if(error&&typeof error==='object'&&'message' in error){
      return String((error as {message?:unknown}).message||'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
