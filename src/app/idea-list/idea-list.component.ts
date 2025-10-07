import { Component, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CategoryFilterComponent } from '../components/category-filter/category-filter.component';
import { Subject, takeUntil } from 'rxjs';
import { IdeaService, Idea } from '../services/idea.service';
import { BookmarkService } from '../services/bookmark.service';
import { AnalyticsService } from '../services/analytics.service';
import { ConfettiService } from '../services/confetti.service';
import { ToastService } from '../services/toast.service';
import { Observable, of } from 'rxjs';
import { Auth, User, user } from '@angular/fire/auth';

// Idea interface is now imported from the service

@Component({
  selector: 'app-idea-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CategoryFilterComponent],
  templateUrl: './idea-list.component.html',
  styleUrls: ['./idea-list.component.scss']
})
export class IdeaListComponent implements OnDestroy {
  ideas$: Observable<Idea[]> = of([]); // still used for search fallback
  currentUser$: Observable<User | null>;
  sortMode: 'recent' | 'trending' = 'recent';
  searchTerm = '';
  selectedCategory: string | null = null;
  // Infinite scroll state
  pagedIdeas: Idea[] = [];
  loadingPage = false;
  endReached = false;
  private pageCursor: any = null;
  private pageSize = 12;
  private observer?: IntersectionObserver;
  private destroy$ = new Subject<void>();
  private sentinelId = 'ideas-sentinel';

  private auth: Auth = inject(Auth);
  private ideaService: IdeaService = inject(IdeaService);
  private confettiService: ConfettiService = inject(ConfettiService);
  private toastService: ToastService = inject(ToastService);
  private bookmarkService: BookmarkService = inject(BookmarkService);
  private analytics: AnalyticsService = inject(AnalyticsService);
  bookmarkedIds: Set<string> = new Set();

  constructor() {
    this.currentUser$ = user(this.auth);
    this.applyFeedSource();
    // Setup intersection observer for infinite scroll
    setTimeout(() => this.initObserver(), 0);
  }

  ngOnDestroy() { this.destroy$.next(); this.destroy$.complete(); this.observer?.disconnect(); }

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
    // Reset paged loading when switching modes (only for recent mode infinite scroll)
    if (this.sortMode === 'recent' && !this.searchTerm && !this.selectedCategory) {
      this.resetPaged();
      this.loadNextPage();
    }
  }

  onCategorySelected(cat: string) {
    this.selectedCategory = cat === 'all' ? null : cat;
    this.resetPaged();
    if (!this.searchTerm && this.sortMode === 'recent') {
      this.loadNextPage();
    } else {
      this.applyFeedSource();
      this.bookmarkService.list().subscribe(ids => {
        this.bookmarkedIds = new Set(ids);
      });
    }
  }

  private resetPaged() {
    this.pagedIdeas = [];
    this.pageCursor = null;
    this.endReached = false;
  }

  private async loadNextPage() {
    if (this.loadingPage || this.endReached || this.sortMode !== 'recent' || this.searchTerm) return;
    this.loadingPage = true;
    try {
      const { ideas, nextCursor } = await this.ideaService.getRecentIdeasPage(this.pageSize, this.pageCursor, this.selectedCategory || undefined);
      this.pagedIdeas.push(...ideas);
      this.pageCursor = nextCursor || null;
      if (!nextCursor) this.endReached = true;
    } catch (e) {
      console.error('Failed to load page', e);
    } finally {
      this.loadingPage = false;
    }
  }

  private initObserver() {
    const el = document.getElementById(this.sentinelId);
    if (!el) { setTimeout(() => this.initObserver(), 200); return; }
    this.observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.loadNextPage();
        }
      });
    }, { rootMargin: '200px 0px' });
    this.observer.observe(el);
  }

  async upvoteIdea(idea: Idea, currentUser: User, event: Event) {
    // prevent parent routerLink navigation when clicking inside the card
    event.preventDefault();
    event.stopPropagation();
    if (!idea.id) return;
    
    const button = event.target as HTMLElement;
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

  formatDate(date: any): string {
    if (!date) return '';
    const d = typeof date?.toDate === 'function' ? date.toDate() : new Date(date);
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

  isBookmarked(id?: string): boolean { return !!id && this.bookmarkedIds.has(id); }

  async toggleBookmark(idea: Idea, ev: Event) {
    ev.preventDefault(); ev.stopPropagation();
    if (!idea.id) return;
    const currently = this.isBookmarked(idea.id);
    try {
      const res = await this.bookmarkService.toggle(idea.id);
      if (res.bookmarked) {
        this.bookmarkedIds.add(idea.id);
        this.toastService.success('🔖 Idea bookmarked');
        this.analytics.ideaBookmarked(idea.id);
      } else {
        this.bookmarkedIds.delete(idea.id);
        this.toastService.info('Bookmark removed');
      }
    } catch (e) {
      this.toastService.error('Failed to toggle bookmark');
      console.error(e);
      this.analytics.actionFailed('bookmark_toggle', (e as any)?.message, { idea_id: idea.id });
      if (!currently) this.bookmarkedIds.delete(idea.id); else this.bookmarkedIds.add(idea.id);
    }
  }
}
