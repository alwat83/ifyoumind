import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { IdeaService } from '../services/idea.service';
import { ConfettiService } from '../services/confetti.service';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-idea-submit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './idea-submit.component.html',
  styleUrl: './idea-submit.component.scss'
})
export class IdeaSubmitComponent {
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

  auth: Auth = inject(Auth);
  router: Router = inject(Router);
  ideaService: IdeaService = inject(IdeaService);
  confettiService: ConfettiService = inject(ConfettiService);
  toastService: ToastService = inject(ToastService);
  user$: Observable<User | null>;

  constructor() {
    this.user$ = user(this.auth);
  }

  async addIdea() {
    if (this.problem && this.solution && this.impact) {
      this.isSubmitting = true;
      
      try {
        const currentUser = await new Promise<User | null>((resolve) => {
          const sub = this.user$.subscribe(user => { resolve(user); sub.unsubscribe(); });
        });

        if (currentUser) {
          await this.ideaService.createIdea({
            problem: this.problem,
            solution: this.solution,
            impact: this.impact,
            category: this.selectedCategory,
            tags: [], // Will be populated later
            isPublic: true // All ideas are public by default
          }, currentUser);

          this.problem = '';
          this.solution = '';
          this.impact = '';
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
      } finally {
        this.isSubmitting = false;
      }
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }
}