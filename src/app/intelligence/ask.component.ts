import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AskResponse, AskService, RecentQuestion } from './ask.service';
import { IntelligenceOrganization, OrganizationService } from './organization.service';

@Component({
  selector: 'app-ask-intelligence',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './ask.component.html',
  styleUrls: ['./ask.component.scss'],
})
export class AskIntelligenceComponent implements OnInit {
  private readonly organizations = inject(OrganizationService);
  private readonly askService = inject(AskService);

  workspace: IntelligenceOrganization | null = null;
  question = '';
  response: AskResponse | null = null;
  recent: RecentQuestion[] = [];
  loading = true;
  asking = false;
  error = '';

  readonly prompts = [
    'How was traffic this week?',
    'How many sessions did we have?',
    'How many key events did we get?',
    'What changed this week?',
  ];

  async ngOnInit(): Promise<void> {
    try {
      this.workspace = await this.organizations.getMyWorkspace();
      if (this.workspace) {
        this.recent = await this.askService.recent(this.workspace.organizationId);
      }
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.loading = false;
    }
  }

  usePrompt(prompt: string): void {
    this.question = prompt;
  }

  async submit(): Promise<void> {
    const question = this.question.trim();
    if (!this.workspace || !question || this.asking) return;

    this.asking = true;
    this.error = '';
    try {
      this.response = await this.askService.ask(this.workspace.organizationId, question);
      this.question = '';
      this.recent = await this.askService.recent(this.workspace.organizationId);
    } catch (error) {
      this.error = this.message(error);
    } finally {
      this.asking = false;
    }
  }

  private message(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message?: unknown }).message || 'Something went wrong.');
    }
    return 'Something went wrong.';
  }
}
