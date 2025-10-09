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
import { SeoService } from '../services/seo.service';

// Idea interface is now imported from the service

import { IdeaCardComponent } from '../components/idea-card/idea-card.component';

@Component({
  selector: 'app-idea-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, CategoryFilterComponent, IdeaCardComponent],
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
  private seo = inject(SeoService);
  bookmarkedIds: Set<string> = new Set();

  constructor() {
    this.currentUser$ = user(this.auth);
    this.seo.generateTags({
      title: 'ifyoumind | Share Your Ideas',
      description: 'A community-driven platform to share, discover, and discuss new and innovative ideas for startups, projects, and more.'
    });
    this.applyFeedSource();
    // Setup intersection observer for infinite scroll
    setTimeout(() => this.initObserver(), 0);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    this.observer?.disconnect();
    this.seo.generateTags({}); // Reset tags when leaving
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
    }
    this.bookmarkService.list().subscribe(ids => {
      this.bookmarkedIds = new Set(ids);
    });
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


}
