import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface IntelligenceInsight {
  id: string;
  metric: string;
  title: string;
  direction: 'up' | 'down' | 'flat' | 'unavailable';
  changePercent: number | null;
  currentValue: number;
  baselineValue: number;
  currentWindow: { from: string; through: string };
  baselineWindow: { from: string; through: string };
  freshnessAt: string | null;
  qualityFlags: string[];
  source: string;
}

@Injectable({ providedIn: 'root' })
export class InsightFeedService {
  private readonly functions = inject(Functions);

  async getFeed(organizationId: string): Promise<IntelligenceInsight[]> {
    const call = httpsCallable<
      { organizationId: string },
      { insights: IntelligenceInsight[] }
    >(this.functions, 'getIntelligenceInsightFeed');

    return (await call({ organizationId })).data.insights;
  }
}
