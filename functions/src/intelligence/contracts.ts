/** Versioned boundary shared by source adapters, scheduled syncs, and insight rules. */
export type SourceKind = 'stripe' | 'ga4' | 'google_ads' | 'search_console';
export type MetricKey =
  | 'stripe.cash_collected_minor' | 'stripe.refunds_minor'
  | 'ga4.sessions' | 'ga4.key_events'
  | 'google_ads.spend_minor' | 'google_ads.clicks'
  | 'search_console.clicks' | 'search_console.impressions';
export type QualityFlag =
  | 'sampled' | 'thresholded' | 'partial_period' | 'late_data'
  | 'estimated' | 'provider_unavailable';

export interface DateWindow { from: string; through: string; }
export interface MetricFact {
  schemaVersion: 1;
  organizationId: string;
  connectionId: string;
  source: SourceKind;
  sourceAccountId: string;
  metric: MetricKey;
  date: string; // YYYY-MM-DD in reportingTimezone
  reportingTimezone: string; // IANA zone, e.g. America/Chicago
  dimensions: Record<string, string>;
  value: number; // integer count or integer currency minor units
  unit: 'count' | 'currency_minor';
  currency?: string; // ISO 4217 for monetary facts; never sum unlike currencies
  qualityFlags: QualityFlag[];
  sourceUpdatedAt: string;
  observedAt: string;
  syncRunId: string;
}
export interface SourceReference {
  connectionId: string;
  source: SourceKind;
  sourceAccountId: string;
  metric: MetricKey;
  window: DateWindow;
  factKeys: string[];
  freshnessAt: string;
  qualityFlags: QualityFlag[];
}
export interface InsightEvidence {
  organizationId: string;
  ruleVersion: string;
  metric: MetricKey;
  current: { value: number; sampleSize: number; window: DateWindow };
  baseline: { value: number; sampleSize: number; window: DateWindow };
  sources: SourceReference[];
  interpretation: 'observation' | 'hypothesis';
}

export interface ConnectorAccount { id: string; label: string; reportingTimezone: string; }
export interface SyncRequest {
  organizationId: string;
  connectionId: string;
  sourceAccountId: string;
  window: DateWindow;
  cursor?: string;
  syncRunId: string;
}
export interface SyncPage {
  facts: MetricFact[];
  nextCursor?: string;
  // Checkpoint is persisted only after all facts on this page are committed.
  checkpoint: string;
  qualityFlags: QualityFlag[];
}
export interface DataConnector {
  readonly source: SourceKind;
  discoverAccounts(connectionId: string): Promise<ConnectorAccount[]>;
  validateConnection(connectionId: string): Promise<void>;
  syncPage(request: SyncRequest): Promise<SyncPage>;
  disconnect(connectionId: string): Promise<void>;
}
export type SyncStatus = 'queued' | 'running' | 'succeeded' | 'failed';
export interface SyncJob {
  schemaVersion: 1;
  id: string;
  organizationId: string;
  connectionId: string;
  source: SourceKind;
  sourceAccountId: string;
  window: DateWindow;
  status: SyncStatus;
  attempts: number;
  cursor?: string;
  checkpoint?: string;
  startedAt?: string;
  finishedAt?: string;
  failureCode?: string; // stable category, no token or provider payload
}
