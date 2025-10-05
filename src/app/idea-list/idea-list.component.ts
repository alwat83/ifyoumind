import { Component, inject } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IdeaService, Idea } from '../services/idea.service';
import { ConfettiService } from '../services/confetti.service';
import { ToastService } from '../services/toast.service';

// Idea interface is now imported from the service

@Component({
  selector: 'app-idea-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './idea-list.component.html',
  styleUrls: ['./idea-list.component.scss']
})
export class IdeaListComponent {
  ideas$: Observable<Idea[]> = of([]);
  currentUser$: Observable<User | null>;
  sortMode: 'recent' | 'trending' = 'recent';
  searchTerm = '';
  selectedCategory: string | null = null;

  constructor(
    private auth: Auth,
    private ideaService: IdeaService,
    private confettiService: ConfettiService,
    private toastService: ToastService
  ) {
    this.currentUser$ = user(this.auth);
    this.applyFeedSource();
  }

  applyFeedSource() {
    if (this.searchTerm?.trim()) {
      this.ideas$ = this.ideaService.searchIdeas(this.searchTerm.trim());
      return;
    }
    if (this.selectedCategory) {
      this.ideas$ = this.ideaService.getIdeasByCategory(this.selectedCategory);
      return;
    }
    this.ideas$ = this.sortMode === 'trending'
      ? this.ideaService.getTrendingIdeas(50)
      : this.ideaService.getRecentIdeas(50);
  }

  async upvoteIdea(idea: Idea, currentUser: User, event: Event) {
    // prevent parent routerLink navigation when clicking inside the card
    event.preventDefault();
    event.stopPropagation();
    if (!idea.id) return;
    
    const button = event.target as HTMLElement;
    const hasUpvoted = idea.upvotedBy?.includes(currentUser.uid) || false;
    
    try {
      await this.ideaService.upvoteIdea(idea.id, currentUser.uid, hasUpvoted);
      
      // Trigger confetti animation
      this.confettiService.triggerConfetti(button, 'upvote');
      
      // Show toast notification
      if (hasUpvoted) {
        this.toastService.info('💔 Upvote removed');
      } else {
        this.toastService.success('❤️ Idea upvoted! Thanks for supporting this idea!');
      }
      
    } catch (error) {
      this.toastService.error('❌ Failed to update upvote. Please try again.');
      console.error('Upvote error:', error);
    }
  }

  hasUpvoted(idea: Idea, currentUser: User): boolean {
    return idea.upvotedBy?.includes(currentUser.uid) || false;
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  }

  // New interactive methods
  shareIdea(idea: Idea) {
    if (navigator.share) {
      navigator.share({
        title: 'Check out this amazing idea!',
        text: `${idea.problem} - ${idea.solution}`,
        url: window.location.href
      }).then(() => {
        this.toastService.success('📤 Idea shared successfully!');
      }).catch(() => {
        this.copyIdeaLink(idea);
      });
    } else {
      this.copyIdeaLink(idea);
    }
  }

  private copyIdeaLink(idea: Idea) {
    const link = `${window.location.origin}/idea/${idea.id}`;
    navigator.clipboard.writeText(link).then(() => {
      this.toastService.success('🔗 Link copied to clipboard!');
    }).catch(() => {
      this.toastService.error('❌ Failed to copy link');
    });
  }

  getTrendingBadge(idea: Idea): string {
    if (!idea.trendingScore) return '';
    
    if (idea.trendingScore > 10) return '🔥';
    if (idea.trendingScore > 5) return '⭐';
    if (idea.trendingScore > 2) return '✨';
    return '';
  }

  getCategoryIcon(category?: string): string {
    const icons: { [key: string]: string } = {
      'technology': '💻',
      'environment': '🌱',
      'health': '🏥',
      'education': '📚',
      'social': '🤝',
      'business': '💼',
      'general': '💡'
    };
    return icons[category || 'general'] || '💡';
  }
}
