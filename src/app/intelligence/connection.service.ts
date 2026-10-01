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

export interface GoogleAnalyticsProperty {
  id: string;
  displayName: string;
  accountDisplayName: string;
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

  async beginGoogleAnalyticsConnection(organizationId: string): Promise<string> {
    const begin = httpsCallable<
      { organizationId: string },
      { authorizationUrl: string }
    >(this.functions, 'beginGoogleAnalyticsConnection');

    return (await begin({ organizationId })).data.authorizationUrl;
  }

  async discoverGoogleAnalyticsProperties(organizationId: string): Promise<GoogleAnalyticsProperty[]> {
    const discover = httpsCallable<
      { organizationId: string },
      { properties: GoogleAnalyticsProperty[] }
    >(this.functions, 'discoverGoogleAnalyticsProperties');

    return (await discover({ organizationId })).data.properties;
  }

  async selectGoogleAnalyticsProperty(
    organizationId: string,
    propertyId: string,
  ): Promise<void> {
    const select = httpsCallable<
      { organizationId: string; propertyId: string },
      { connection: IntelligenceConnection }
    >(this.functions, 'selectGoogleAnalyticsProperty');

    await select({ organizationId, propertyId });
  }
}
