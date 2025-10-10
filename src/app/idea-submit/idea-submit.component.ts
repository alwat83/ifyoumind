import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { IdeaService } from '../services/idea.service';
import { ConfettiService } from '../services/confetti.service';
import { ToastService } from '../services/toast.service';
import { AuthHelperService } from '../services/auth-helper.service';
import { AnalyticsService } from '../services/analytics.service';

@Component({
  selector: 'app-idea-submit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './idea-submit.component.html',
  styleUrl: './idea-submit.component.scss'
})
export class IdeaSubmitComponent implements OnInit, OnDestroy {
  problem = '';
  solution = '';
  impact = '';
  selectedCategory = 'general';
  categories = [
    { id: 'technology', name: 'Technology', icon: '💻' },
    { id: 'environment', name: 'Environment', icon: '🌱' },
    { id: 'health', name: 'Health', icon: '🏥' },
    { id: 'education', name: 'Education', icon: '📚' },
    { id: 'social', name: 'Social', icon: '🤝' },
    { id: 'business', name: 'Business', icon: '💼' },
    { id: 'general', name: 'General', icon: '💡' }
  ];
  isSubmitting = false;
  showSuccess = false;
  isHelpOpen = false;

  auth: Auth = inject(Auth);
  router: Router = inject(Router);
  ideaService: IdeaService = inject(IdeaService);
  confettiService: ConfettiService = inject(ConfettiService);
  toastService: ToastService = inject(ToastService);
  user$: Observable<User | null>;
  authHelper: AuthHelperService = inject(AuthHelperService);
  analytics: AnalyticsService = inject(AnalyticsService);

  constructor() {
    this.user$ = user(this.auth);
  }

  toggleHelp() {
    this.isHelpOpen = !this.isHelpOpen;
  }

  private draftKey = 'idea_draft_v1';
  private saveTimer: any;

  ngOnInit() {
    // Restore draft if present
    try {
      const raw = localStorage.getItem(this.draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        this.problem = draft.problem || '';
        this.solution = draft.solution || '';
        this.impact = draft.impact || '';
        this.selectedCategory = draft.selectedCategory || this.selectedCategory;
      }
    } catch {}
  }

  ngOnDestroy() { if (this.saveTimer) clearTimeout(this.saveTimer); }

  private scheduleSave() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this.persistDraft(), 500);
  }

  private persistDraft() {
    try {
      const hasContent = this.problem || this.solution || this.impact;
      if (!hasContent) { localStorage.removeItem(this.draftKey); return; }
      localStorage.setItem(this.draftKey, JSON.stringify({
        problem: this.problem,
        solution: this.solution,
        impact: this.impact,
        selectedCategory: this.selectedCategory,
        ts: Date.now()
      }));
    } catch {}
  }

  onFieldChange() { this.scheduleSave(); }

  clearDraft() {
    localStorage.removeItem(this.draftKey);
    this.problem = this.solution = this.impact = '';
  }

  async addIdea() {
    if (this.problem && this.solution && this.impact) {
      this.isSubmitting = true;
      
      try {
        const currentUser = await this.authHelper.getCurrentUserOnce();

        if (currentUser) {
          const created = await this.ideaService.createIdea({
            problem: this.problem,
            solution: this.solution,
            impact: this.impact,
            category: this.selectedCategory,
            tags: [], // Will be populated later
            isPublic: true // All ideas are public by default
          }, currentUser);
          if (created && 'id' in created) {
            this.analytics.ideaCreated(created.id, this.selectedCategory);
          }

          this.problem = '';
          this.solution = '';
          this.impact = '';
          // Clear draft after successful submission
          localStorage.removeItem(this.draftKey);
          this.showSuccess = true;
          
          // Trigger celebration confetti
          const submitButton = document.querySelector('.submit-button') as HTMLElement;
          if (submitButton) {
            this.confettiService.triggerConfetti(submitButton, 'celebration');
          }
          
          // Show success toast
          this.toastService.success('🎉 Idea submitted successfully! Thank you for sharing!');
          
          // Navigate back after a brief delay
          setTimeout(() => {
            this.router.navigate(['/']);
          }, 1200);
        }
      } catch (error) {
        console.error('Error submitting idea:', error);
        this.toastService.error('❌ Failed to submit idea. Please try again.');
        this.analytics.actionFailed('idea_create', (error as any)?.message);
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}