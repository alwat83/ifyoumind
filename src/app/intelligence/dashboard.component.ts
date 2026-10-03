import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Ga4DashboardMetric, IntelligenceDashboardService } from './dashboard.service';
import { OrganizationService, IntelligenceOrganization } from './organization.service';

type ConnectorState = 'ready' | 'next' | 'deferred';
interface ConnectorCard { name: string; description: string; metrics: string[]; state: ConnectorState; }

@Component({
  selector: 'app-intelligence-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class IntelligenceDashboardComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);
  private readonly dashboard = inject(IntelligenceDashboardService);

  workspace: IntelligenceOrganization | null = null;
  ga4: Ga4DashboardMetric | null = null;
  workspaceName = '';
  loading = true;
  creating = false;
  error = '';

  readonly connectors: ConnectorCard[] = [
    { name: 'Google Analytics 4', description: 'Traffic and conversion activity.', metrics: ['Sessions', 'Key events'], state: 'ready' },
    { name: 'Search Console', description: 'Organic search demand and visibility.', metrics: ['Clicks', 'Impressions'], state: 'next' },
    { name: 'Google Ads', description: 'Paid acquisition performance.', metrics: ['Spend', 'Clicks'], state: 'next' },
    { name: 'Stripe', description: 'Revenue, refunds, and cash collected.', metrics: ['Cash collected', 'Refunds'], state: 'deferred' },
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.workspace = await this.organizations.getMyWorkspace();
      if (this.workspace) this.ga4 = (await this.dashboard.getMetrics(this.workspace.organizationId)).ga4;
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.loading = false;
    }
  }

  async createWorkspace(): Promise<void> {
    const name = this.workspaceName.trim();
    if (!name || this.creating) return;
    this.creating = true;
    this.error = '';
    try {
      const organizationId = await this.organizations.createWorkspace(name);
      this.workspace = await this.organizations.getWorkspace(organizationId);
      this.ga4 = (await this.dashboard.getMetrics(organizationId)).ga4;
      this.workspaceName = '';
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.creating = false;
    }
  }

  stateLabel(state: ConnectorState): string {
    if (state === 'ready') return 'Building now';
    if (state === 'deferred') return 'Deferred';
    return 'Next';
  }

  changeLabel(): string {
    if (!this.ga4 || this.ga4.changePercent === null) return 'No prior-period comparison yet';
    const rounded = Math.round(this.ga4.changePercent * 10) / 10;
    if (rounded === 0) return 'Flat vs previous 7 days';
    return `${Math.abs(rounded)}% ${rounded > 0 ? 'up' : 'down'} vs previous 7 days`;
  }

  private message(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
