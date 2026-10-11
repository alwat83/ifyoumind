import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

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
export interface EvidenceValue {
  value:number|null;
  moe:number|null;
  status:'ok'|'controlled'|'open-ended'|'unavailable';
  reliability:'good'|'fair'|'low'|'unknown';
  cv:number|null;
  note?:string;
}
export interface PlaceEvidence {
  location:string;
  geography:{level:'place';name:string;fips:string};
  population:EvidenceValue;
  medianIncome:EvidenceValue;
  medianHomeValue:EvidenceValue;
  growth:EvidenceValue;
  households:EvidenceValue;
  affordable:Array<{threshold:number;count:EvidenceValue;share:EvidenceValue}>;
  age25to44:{count:EvidenceValue;share:EvidenceValue};
}
export interface ComparisonCheck {
  metric:string;
  label:string;
  unit:'USD'|'pct_points'|'share';
  primary:EvidenceValue;
  other:EvidenceValue;
  otherLocation:string;
  test:{gap:number|null;z:number|null;verdict:'higher'|'lower'|'similar'|'not-testable'};
  wording:string;
}
export interface ReportEvidenceReady {
  schemaVersion:1;
  status:'ready'|'partial';
  period:{latest:string;prior:string};
  source:{agency:string;dataset:string;tables:string[];url:string;retrievedAt:string};
  thresholds:number[];
  defaultThreshold:number;
  places:PlaceEvidence[];
  comparisons:ComparisonCheck[];
  reliabilityPolicy:string;
  method:string;
  plainText:string;
}
export type ReportEvidence=ReportEvidenceReady|{schemaVersion:1;status:'unavailable';message:string};
export interface DecisionReportPayload {
  schemaVersion:number;
  marketAnalysis?:MarketAnalysisSection;
  posture:'favorable'|'caution'|'mixed';
  evidenceCoverage:{sourcedMetrics:number;totalMetrics:number;percent:number};
  actionPlan:Array<{stage:string;title:string;detail:string}>;
  comparisonFindings:Array<{location:string;findings:string[]}>;
  decisionTriggers:{strengthens:string;weakens:string;unresolved:string};
  limitations:string[];
  evidence?:ReportEvidence;
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
  decisionReportAccess?:'purchased'|'pro'|'none';
  sample?:boolean;
  /** Places compared only in the full Decision Report (free briefs show one comparison). */
  reportOnlyLocations?:string[];
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

  async sample():Promise<MarketProject>{
    const call=httpsCallable<Record<string,never>,MarketProject>(this.functions,'getSampleDecisionReport');
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
