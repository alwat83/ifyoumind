import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GrowthMetricsService, ProductFunnelMetrics } from './growth-metrics.service';

@Component({
  selector:'app-growth-dashboard',
  standalone:true,
  imports:[CommonModule,RouterLink],
  templateUrl:'./growth-dashboard.component.html',
  styleUrls:['./growth-dashboard.component.scss'],
})
export class GrowthDashboardComponent implements OnInit{
  private readonly growth=inject(GrowthMetricsService);
  metrics:ProductFunnelMetrics|null=null;
  loading=true;
  error='';

  gross(byCurrency:Record<string,number>|undefined):string{
    const entries=Object.entries(byCurrency||{});
    if(!entries.length)return '$0';
    return entries
      .map(([currency,cents])=>new Intl.NumberFormat('en-US',{style:'currency',currency}).format(cents/100))
      .join(' + ');
  }

  money(amount:number|null,currency:string|null):string{
    if(amount===null||!currency)return '—';
    return new Intl.NumberFormat('en-US',{style:'currency',currency}).format(amount/100);
  }

  async ngOnInit():Promise<void>{
    try{this.metrics=await this.growth.get(30);}
    catch(error){
      this.error=error&&typeof error==='object'&&'message' in error
        ? String((error as {message?:unknown}).message||'Could not load growth metrics.')
        : 'Could not load growth metrics.';
    }finally{this.loading=false;}
  }
}
