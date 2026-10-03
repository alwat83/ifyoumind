import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export interface Ga4DashboardMetric {
  sessions: number;
  baselineSessions: number;
  changePercent: number | null;
  currentWindow: { from: string; through: string };
  baselineWindow: { from: string; through: string };
  sampleSize: number;
  lastSyncedAt: string | null;
  accountLabel: string | null;
}

@Injectable({ providedIn: 'root' })
export class IntelligenceDashboardService {
  private readonly functions = inject(Functions);

  async getMetrics(organizationId: string): Promise<{ ga4: Ga4DashboardMetric | null }> {
    const getMetrics = httpsCallable<
      { organizationId: string },
      { ga4: Ga4DashboardMetric | null }
    >(this.functions, 'getIntelligenceDashboardMetrics');

    return (await getMetrics({ organizationId })).data;
  }
}
