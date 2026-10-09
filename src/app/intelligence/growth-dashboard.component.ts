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

  async ngOnInit():Promise<void>{
    try{this.metrics=await this.growth.get(30);}
    catch(error){
      this.error=error&&typeof error==='object'&&'message' in error
        ? String((error as {message?:unknown}).message||'Could not load growth metrics.')
        : 'Could not load growth metrics.';
    }finally{this.loading=false;}
  }
}
