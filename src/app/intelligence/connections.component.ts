import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ConnectionService, IntelligenceConnection, IntelligenceSource } from './connection.service';
import { IntelligenceOrganization, OrganizationService } from './organization.service';

interface SourceDefinition {
  source: IntelligenceSource;
  name: string;
  description: string;
  metrics: string[];
  priority: 'now' | 'later';
}

@Component({
  selector: 'app-intelligence-connections',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './connections.component.html',
  styleUrls: ['./connections.component.scss'],
})
export class IntelligenceConnectionsComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);
  private readonly connectionsService = inject(ConnectionService);

  workspace: IntelligenceOrganization | null = null;
  connections = new Map<IntelligenceSource, IntelligenceConnection>();
  loading = true;
  connectingGoogle = false;
  error = '';

  readonly sources: SourceDefinition[] = [
    {
      source: 'ga4',
      name: 'Google Analytics 4',
      description: 'Understand traffic, engagement, and conversion activity.',
      metrics: ['Sessions', 'Key events'],
      priority: 'now',
    },
    {
      source: 'search_console',
      name: 'Search Console',
      description: 'See how people discover you through organic search.',
      metrics: ['Clicks', 'Impressions'],
      priority: 'later',
    },
    {
      source: 'google_ads',
      name: 'Google Ads',
      description: 'Measure paid acquisition performance and spend.',
      metrics: ['Spend', 'Clicks'],
      priority: 'later',
    },
    {
      source: 'stripe',
      name: 'Stripe',
      description: 'Revenue integration is intentionally deferred until the dedicated ifYouMind Stripe account is ready.',
      metrics: ['Cash collected', 'Refunds'],
      priority: 'later',
    },
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.workspace = await this.organizations.getMyWorkspace();
      if (this.workspace) await this.refreshConnections();
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.loading = false;
    }
  }

  async connectGoogleAnalytics(): Promise<void> {
    if (!this.workspace || this.connectingGoogle) return;
    this.connectingGoogle = true;
    this.error = '';

    try {
      const url = await this.connectionsService.beginGoogleAnalyticsConnection(
        this.workspace.organizationId,
      );
      window.location.assign(url);
    } catch (error) {
      this.error = this.message(error);
      this.connectingGoogle = false;
    }
  }

  status(source: IntelligenceSource): string {
    return this.connections.get(source)?.status ?? 'not_connected';
  }

  statusLabel(source: IntelligenceSource): string {
    const status = this.status(source);
    if (status === 'connected') return 'Connected';
    if (status === 'connecting') return 'Connecting';
    if (status === 'error') return 'Needs attention';
    return 'Not connected';
  }

  private async refreshConnections(): Promise<void> {
    if (!this.workspace) return;
    const connections = await this.connectionsService.listConnections(this.workspace.organizationId);
    this.connections = new Map(connections.map((connection) => [connection.source, connection]));
  }

  private message(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
