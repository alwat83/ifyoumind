import { Injectable, inject } from '@angular/core';
import { Analytics, logEvent } from '@angular/fire/analytics';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private analytics = inject(Analytics);
  private router = inject(Router);
  private initialized = false;
  private lastPageStart = Date.now();
  private lastPath: string | null = null;

  constructor() {
    // Delay subscription until analytics instance is ready
    queueMicrotask(() => this.initPageTracking());
  }

  private initPageTracking() {
    if (this.initialized) return;
    this.initialized = true;
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe((e) => {
      const nav = e as NavigationEnd;
      const now = Date.now();
      // Emit dwell time for previous page
      if (this.lastPath) {
        const dwellMs = now - this.lastPageStart;
        this.safeLog('page_dwell', { page_path: this.lastPath, dwell_ms: dwellMs });
      }
      this.lastPath = nav.urlAfterRedirects;
      this.lastPageStart = now;
      this.safeLog('page_view', { page_path: nav.urlAfterRedirects });
    });
    // Fire dwell on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        if (this.lastPath) {
          const dwellMs = Date.now() - this.lastPageStart;
          this.safeLog('page_dwell', { page_path: this.lastPath, dwell_ms: dwellMs, terminal: true });
        }
      });
    }
  }

  /** Wrap logEvent with guard so SSR / unsupported environments don't break */
  safeLog(eventName: string, params?: Record<string, any>) {
    try {
      logEvent(this.analytics, eventName, params);
    } catch (err) {
      // Silently ignore analytics failures
      if (typeof console !== 'undefined') {
        console.debug('[analytics] skipped', eventName, err);
      }
    }
  }

  ideaUpvoted(ideaId: string) { this.safeLog('idea_upvoted', { idea_id: ideaId }); }
  ideaBookmarked(ideaId: string) { this.safeLog('idea_bookmarked', { idea_id: ideaId }); }
  ideaCreated(ideaId: string, category?: string) { this.safeLog('idea_created', { idea_id: ideaId, category }); }
  commentAdded(ideaId: string) { this.safeLog('comment_added', { idea_id: ideaId }); }
  ideaShared(ideaId: string, method: string) { this.safeLog('idea_shared', { idea_id: ideaId, method }); }
  actionFailed(action: string, reason?: string, context?: Record<string, any>) {
    this.safeLog('action_failed', { action, reason, ...context });
  }
}
