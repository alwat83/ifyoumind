import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { IdeaService } from '../../services/idea.service';
import { ConfettiService } from '../../services/confetti.service';
import { ToastService } from '../../services/toast.service';
import { AuthHelperService } from '../../services/auth-helper.service';

@Component({
  selector: 'app-idea-wizard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './idea-wizard.component.html',
  styleUrls: ['./idea-wizard.component.scss'],
})
export class IdeaWizardComponent {
  private auth: Auth = inject(Auth);
  private ideaService: IdeaService = inject(IdeaService);
  private confettiService: ConfettiService = inject(ConfettiService);
  private toastService: ToastService = inject(ToastService);
  private authHelper: AuthHelperService = inject(AuthHelperService);

  @Output() ideaSubmitted = new EventEmitter<void>();
  @Output() wizardClosed = new EventEmitter<void>();

  user$: Observable<User | null>;

  currentStep = 1;
  totalSteps = 4;
  isSubmitting = false;

  // Form data
  ideaData = {
    problem: '',
    solution: '',
    impact: '',
    category: 'general',
    tags: [] as string[],
  };

  // Available categories
  categories = [
    {
      id: 'technology',
      name: 'Technology',
      icon: '💻',
      color: 'from-blue-500 to-cyan-500',
    },
    {
      id: 'environment',
      name: 'Environment',
      icon: '🌱',
      color: 'from-green-500 to-emerald-500',
    },
    {
      id: 'health',
      name: 'Health',
      icon: '🏥',
      color: 'from-red-500 to-pink-500',
    },
    {
      id: 'education',
      name: 'Education',
      icon: '📚',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      id: 'social',
      name: 'Social',
      icon: '🤝',
      color: 'from-orange-500 to-yellow-500',
    },
    {
      id: 'business',
      name: 'Business',
      icon: '💼',
      color: 'from-gray-500 to-slate-500',
    },
    {
      id: 'general',
      name: 'General',
      icon: '💡',
      color: 'from-indigo-500 to-purple-500',
    },
  ];

  constructor() {
    this.user$ = user(this.auth);
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  selectCategory(categoryId: string) {
    this.ideaData.category = categoryId;
    this.nextStep();
  }

  async submitIdea() {
    this.isSubmitting = true;

    try {
      const currentUser = await this.authHelper.getCurrentUserOnce();

      if (currentUser) {
        await this.ideaService.createIdea(
          {
            problem: this.ideaData.problem,
            solution: this.ideaData.solution,
            impact: this.ideaData.impact,
            category: this.ideaData.category,
            tags: this.ideaData.tags,
          },
          currentUser,
        );

        // Trigger celebration
        const submitButton = document.querySelector(
          '.submit-wizard-button',
        ) as HTMLElement;
        if (submitButton) {
          this.confettiService.triggerConfetti(submitButton, 'celebration');
        }

        this.toastService.success(
          '🎉 Idea submitted successfully! Thank you for sharing!',
        );
        this.ideaSubmitted.emit();

        // Reset form
        this.resetForm();
      }
    } catch (error) {
      this.toastService.error('❌ Failed to submit idea. Please try again.');
      console.error('Error submitting idea:', error);
    } finally {
      this.isSubmitting = false;
    }
  }

  resetForm() {
    this.ideaData = {
      problem: '',
      solution: '',
      impact: '',
      category: 'general',
      tags: [],
    };
    this.currentStep = 1;
  }

  closeWizard() {
    this.wizardClosed.emit();
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  getCurrentCategory() {
    return this.categories.find((cat) => cat.id === this.ideaData.category);
  }

  isStepValid(step: number): boolean {
    switch (step) {
      case 1:
        return this.ideaData.problem.trim().length > 10;
      case 2:
        return this.ideaData.solution.trim().length > 10;
      case 3:
        return this.ideaData.impact.trim().length > 10;
      case 4:
        return true; // Category selection
      default:
        return false;
    }
  }
}
