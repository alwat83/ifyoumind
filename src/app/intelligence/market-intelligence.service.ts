import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { SAMPLE_REQUEST_TIMEOUT_MS } from './sample-report-loading';

export interface MarketMetric {
  key:string;
  label:string;
  value:number;
  unit:string;
  direction:string;
  sourceLabel?:string;
  sourceUrl?:string;
}
export interface MarketAnalysisSection {
  title:string;
  intro:string;
  paragraphs:Array<{heading:string;text:string}>;
  rankings:Array<{metric:string;unit:'people'|'USD'|'%';ordered:Array<{location:string;value:number}>}>;
  nextResearch:string[];
  citations:string[];
  disclaimer:string;
  plainText:string;
}
export interface DecisionReportPayload {
  schemaVersion:number;
  marketAnalysis?:MarketAnalysisSection;
  posture:'favorable'|'caution'|'mixed';
  evidenceCoverage:{sourcedMetrics:number;totalMetrics:number;percent:number};
  actionPlan:Array<{stage:string;title:string;detail:string}>;
  comparisonFindings:Array<{location:string;findings:string[]}>;
  decisionTriggers:{strengthens:string;weakens:string;unresolved:string};
  limitations:string[];
}
export interface MarketBrief {
  metrics:MarketMetric[];
  opportunities:string[];
  risks:string[];
  questions:string[];
  comparisons:Array<{location:string;metrics:MarketMetric[]}>;
  sources?:Array<{provider:string;dataset:string;retrievedAt:string;url:string}>;
  decisionReport?:DecisionReportPayload;
}
export interface MarketProject {
  id:string;
  location:string;
  concept:string;
  decision:string;
  mode:'demo'|'live';
  brief?:MarketBrief;
  decisionReportPurchased?:boolean;
  decisionReportGenerationRequired?:boolean;
  reportExplanationAvailable?:boolean;
  decisionReportAccess?:'purchased'|'pro'|'none';
  sample?:boolean;
  /** Places compared only in the full Decision Report (free briefs show one comparison). */
  reportOnlyLocations?:string[];
  dataNotice?:string;
  comparisonLocations?:string[];
  createdAt?:string|null;
}

export interface ReportExplanation {
  source:'openai'|'deterministic';
  takeaway:{id:string;place:string;statement:string;sourceUrl:string;limitation:string};
  observations:Array<{id:string;place:string;statement:string;sourceUrl:string;limitation:string}>;
  limitation:string;
  nextStep:string;
  reason?:string;
}

@Injectable({providedIn:'root'})
export class MarketIntelligenceService {
  private readonly functions=inject(Functions);

  async explainReport(organizationId:string,projectId:string):Promise<ReportExplanation>{
    const call=httpsCallable<{organizationId:string;projectId:string;consent:string},ReportExplanation>(
      this.functions,'explainDecisionReport',{timeout:25_000}
    );
    return (await call({organizationId,projectId,consent:'public-census-explanation-v2'})).data;
  }

  async create(
    organizationId:string,
    location:string,
    concept:string,
    decision:string,
    comparisonLocations:string[],
    requestId?: string,
  ):Promise<MarketProject>{
    const call=httpsCallable<
      {organizationId:string;location:string;concept:string;decision:string;comparisonLocations:string[];requestId?:string},
      MarketProject
    >(this.functions,'createMarketIntelligenceProject');
    return (await call({organizationId,location,concept,decision,comparisonLocations,...(requestId ? { requestId } : {})})).data;
  }

  async sample():Promise<MarketProject>{
    const call=httpsCallable<Record<string,never>,MarketProject>(this.functions,'getSampleDecisionReport',{timeout:SAMPLE_REQUEST_TIMEOUT_MS});
    return (await call({})).data;
  }

  async get(organizationId:string, projectId:string):Promise<MarketProject>{
    const call=httpsCallable<{organizationId:string;projectId:string},MarketProject>(
      this.functions,'getMarketIntelligenceProject'
    );
    return (await call({organizationId,projectId})).data;
  }

  async recent(organizationId:string):Promise<MarketProject[]>{
    const call=httpsCallable<{organizationId:string},{projects:MarketProject[]}>(
      this.functions,'getRecentMarketIntelligenceProjects'
    );
    return (await call({organizationId})).data.projects;
  }
}
