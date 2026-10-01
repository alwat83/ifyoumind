import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OrganizationService, IntelligenceOrganization } from './organization.service';

type ConnectorState = 'ready' | 'next';

interface ConnectorCard {
  name: string;
  description: string;
  metrics: string[];
  state: ConnectorState;
}

@Component({
  selector: 'app-intelligence-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class IntelligenceDashboardComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);

  workspace: IntelligenceOrganization | null = null;
  workspaceName = '';
  loading = true;
  creating = false;
  error = '';

  readonly connectors: ConnectorCard[] = [
    {
      name: 'Stripe',
      description: 'Revenue, refunds, and cash collected.',
      metrics: ['Cash collected', 'Refunds'],
      state: 'ready',
    },
    {
      name: 'Google Analytics 4',
      description: 'Traffic and conversion activity.',
      metrics: ['Sessions', 'Key events'],
      state: 'next',
    },
    {
      name: 'Google Ads',
      description: 'Paid acquisition performance.',
      metrics: ['Spend', 'Clicks'],
      state: 'next',
    },
    {
      name: 'Search Console',
      description: 'Organic search demand and visibility.',
      metrics: ['Clicks', 'Impressions'],
      state: 'next',
    },
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.workspace = await this.organizations.getMyWorkspace();
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
      this.workspaceName = '';
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.creating = false;
    }
  }

  private message(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
