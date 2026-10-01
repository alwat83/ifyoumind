import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';

export type IntelligenceSource = 'ga4' | 'google_ads' | 'search_console' | 'stripe';
export type ConnectionStatus = 'not_connected' | 'connecting' | 'connected' | 'error';

export interface IntelligenceConnection {
  source: IntelligenceSource;
  status: ConnectionStatus;
  accountLabel?: string;
  sourceAccountId?: string;
  lastSyncedAt?: string;
  errorCode?: string;
}

@Injectable({ providedIn: 'root' })
export class ConnectionService {
  private readonly functions = inject(Functions);

  async listConnections(organizationId: string): Promise<IntelligenceConnection[]> {
    const list = httpsCallable<
      { organizationId: string },
      { connections: IntelligenceConnection[] }
    >(this.functions, 'getIntelligenceConnections');

    return (await list({ organizationId })).data.connections;
  }
}
