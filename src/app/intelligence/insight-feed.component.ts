import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InsightFeedService, IntelligenceInsight } from './insight-feed.service';
import { IntelligenceOrganization, OrganizationService } from './organization.service';

@Component({
  selector: 'app-insight-feed',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './insight-feed.component.html',
  styleUrls: ['./insight-feed.component.scss'],
})
export class InsightFeedComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);
  private readonly feed = inject(InsightFeedService);

  workspace: IntelligenceOrganization | null = null;
  insights: IntelligenceInsight[] = [];
  loading = true;
  error = '';

  async ngOnInit(): Promise<void> {
    try {
      this.workspace = await this.organizations.getMyWorkspace();
      if (this.workspace) this.insights = await this.feed.getFeed(this.workspace.organizationId);
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.loading = false;
    }
  }

  metricLabel(metric: string): string {
    if (metric === 'ga4.sessions') return 'Sessions';
    if (metric === 'ga4.key_events') return 'Key events';
    return metric;
  }

  private message(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
