import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface MarketMetric {
  key:string;
  label:string;
  value:number;
  unit:string;
  direction:string;
}
export interface MarketBrief {
  metrics:MarketMetric[];
  opportunities:string[];
  risks:string[];
  questions:string[];
  comparisons:Array<{location:string;metrics:MarketMetric[]}>;
}
export interface MarketProject {
  id:string;
  location:string;
  concept:string;
  decision:string;
  mode:'demo'|'live';
  brief?:MarketBrief;
  dataNotice?:string;
  createdAt?:string|null;
}

@Injectable({providedIn:'root'})
export class MarketIntelligenceService {
  private readonly functions=inject(Functions);

  async create(
    organizationId:string,
    location:string,
    concept:string,
    decision:string,
    comparisonLocations:string[],
  ):Promise<MarketProject>{
    const call=httpsCallable<
      {organizationId:string;location:string;concept:string;decision:string;comparisonLocations:string[]},
      MarketProject
    >(this.functions,'createMarketIntelligenceProject');
    return (await call({organizationId,location,concept,decision,comparisonLocations})).data;
  }

  async recent(organizationId:string):Promise<MarketProject[]>{
    const call=httpsCallable<{organizationId:string},{projects:MarketProject[]}>(
      this.functions,'getRecentMarketIntelligenceProjects'
    );
    return (await call({organizationId})).data.projects;
  }
}
