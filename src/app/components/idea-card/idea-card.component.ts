import { Component, Input, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Idea } from '../../services/idea.service';
import { User, Auth, user } from '@angular/fire/auth';
import { IdeaService } from '../../services/idea.service';
import { BookmarkService } from '../../services/bookmark.service';
import { ToastService } from '../../services/toast.service';
import { AnalyticsService } from '../../services/analytics.service';
import { ConfettiService } from '../../services/confetti.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-idea-card',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './idea-card.component.html',
  styleUrls: ['./idea-card.component.scss']
})
export class IdeaCardComponent implements OnInit, OnDestroy {
  @Input() idea!: Idea;
  private auth: Auth = inject(Auth);
  currentUser$ = user(this.auth);
  currentUser: User | null = null;
  isBookmarked = false;
  private ideaService: IdeaService = inject(IdeaService);
  private bookmarkService: BookmarkService = inject(BookmarkService);
  private toastService: ToastService = inject(ToastService);
  private analytics: AnalyticsService = inject(AnalyticsService);
  private confettiService: ConfettiService = inject(ConfettiService);
  private destroy$ = new Subject<void>();
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);

  ngOnInit() {
    this.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.bookmarkService.list().pipe(takeUntil(this.destroy$)).subscribe(ids => {
          this.isBookmarked = ids.includes(this.idea.id!);
          this.cdr.detectChanges();
        });
      }
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private router: Router = inject(Router);

  navigateToIdea() {
    this.router.navigate(['/idea', this.idea.id]);
  }

  getTrendingBadge(idea: Idea): string {
    if (!idea.trendingScore) return '';
    
    if (idea.trendingScore > 10) return '🔥';
    if (idea.trendingScore > 5) return '⭐';
    if (idea.trendingScore > 2) return '✨';
    return '';
  }

  getCategoryIcon(category?: string): string {
    const icons: Record<string, string> = {
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

  formatDate(date: any): string {
    if (!date) return '';
    const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
    return d.toLocaleDateString();
  }

  async upvoteIdea(idea: Idea, currentUser: User, event: Event) {
    // prevent parent routerLink navigation when clicking inside the card
    event.preventDefault();
    event.stopPropagation();
    if (!idea.id) return;
    
    const button = event.target as HTMLElement;
    button.classList.add('pop-animation');
    setTimeout(() => button.classList.remove('pop-animation'), 300);

    const hasUpvoted = idea.upvotedBy?.includes(currentUser.uid) || false;
    // Optimistic update
    const originalUpvotes = idea.upvotes;
    const originalUpvotedBy = [...(idea.upvotedBy || [])];
    if (hasUpvoted) {
      idea.upvotes = Math.max(0, idea.upvotes - 1);
      idea.upvotedBy = idea.upvotedBy?.filter(id => id !== currentUser.uid) || [];
    } else {
      idea.upvotes = (idea.upvotes || 0) + 1;
      idea.upvotedBy = [...(idea.upvotedBy || []), currentUser.uid];
    }
    try {
      const result = await this.ideaService.upvoteIdea(idea.id);
      this.confettiService.triggerConfetti(button, 'upvote');
      if (result?.upvoted) {
        this.toastService.success('❤️ Idea upvoted!');
        this.analytics.ideaUpvoted(idea.id);
      } else {
        this.toastService.info('💔 Upvote removed');
      }
    } catch (error) {
      // rollback
      idea.upvotes = originalUpvotes;
      idea.upvotedBy = originalUpvotedBy;
      this.toastService.error('❌ Failed to update upvote. Please try again.');
      console.error('Upvote error:', error);
      this.analytics.actionFailed('upvote', (error as any)?.message, { idea_id: idea.id });
    }
  }

  hasUpvoted(idea: Idea, currentUser: User): boolean {
    return idea.upvotedBy?.includes(currentUser.uid) || false;
  }

  async toggleBookmark(idea: Idea, ev: Event) {
    ev.preventDefault(); ev.stopPropagation();
    if (!idea.id) return;

    const button = ev.currentTarget as HTMLElement;
    button.classList.add('fill-in-animation');
    setTimeout(() => button.classList.remove('fill-in-animation'), 300);

    try {
      const res = await this.bookmarkService.toggle(idea.id);
      this.isBookmarked = res.bookmarked;
      if (res.bookmarked) {
        this.toastService.success('🔖 Idea bookmarked');
        this.analytics.ideaBookmarked(idea.id);
      } else {
        this.toastService.info('Bookmark removed');
      }
    } catch (e) {
      this.toastService.error('Failed to toggle bookmark');
      console.error(e);
      this.analytics.actionFailed('bookmark_toggle', (e as any)?.message, { idea_id: idea.id });
    }
  }

  shareIdea(idea: Idea) {
    console.log('shareIdea called');
    if (navigator.share) {
      navigator.share({
        title: 'Check out this amazing idea!',
        text: `${idea.problem} - ${idea.solution}`,
        url: window.location.href
      }).then(() => {
        this.toastService.success('📤 Idea shared successfully!');
        if (idea.id) this.analytics.ideaShared(idea.id, 'web_share');
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
      if (idea.id) this.analytics.ideaShared(idea.id, 'clipboard');
    }).catch(() => {
      this.toastService.error('❌ Failed to copy link');
      if (idea.id) this.analytics.actionFailed('share_copy', 'clipboard_write_failed', { idea_id: idea.id });
    });
  }
}