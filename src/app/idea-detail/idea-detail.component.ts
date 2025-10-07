import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, docData } from '@angular/fire/firestore';
import { Auth, user, User } from '@angular/fire/auth';
import { Idea, IdeaService } from '../services/idea.service';
import { CommentsService, Comment } from '../services/comments.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ModeratorService } from '../services/moderator.service';
import { BookmarkService } from '../services/bookmark.service';
import { ToastService } from '../services/toast.service';
import { AnalyticsService } from '../services/analytics.service';
import { SeoService } from '../services/seo.service';

@Component({
  selector: 'app-idea-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './idea-detail.component.html',
  styleUrls: ['./idea-detail.component.scss']
})
export class IdeaDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private commentsService = inject(CommentsService);
  private auth = inject(Auth);
  private ideaService = inject(IdeaService);
  private moderatorService = inject(ModeratorService);
  private bookmarkService = inject(BookmarkService);
  private toastService = inject(ToastService);
  private destroy$ = new Subject<void>();
  private analytics = inject(AnalyticsService);
  private seo = inject(SeoService);

  ideaId = '';
  idea: Idea | null = null;
  comments$: Observable<Comment[]> | null = null;
  newComment = '';
  currentUser$ = user(this.auth);
  isBookmarked = false;
  editingCommentId: string | null = null;
  editContent = '';

  async ngOnInit() {
    this.ideaId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.ideaId) return;
    const ref = doc(this.firestore, 'ideas', this.ideaId);
    // Subscribe to idea changes via docData (zone-aware)
    docData(ref).subscribe((data: any) => {
      if (data) {
        this.idea = { id: this.ideaId, ...(data as Idea) };
        // Generate SEO tags once the idea is loaded
        this.seo.generateTags({
          title: this.idea.title,
          description: this.idea.problem, // Use the 'problem' as the description
        });
      }
    });
    this.comments$ = this.commentsService.listForIdea(this.ideaId, 100);
    // Track bookmark state
    this.currentUser$.pipe(takeUntil(this.destroy$)).subscribe(u => {
      if (!u) { this.isBookmarked = false; return; }
      this.bookmarkService.list().pipe(takeUntil(this.destroy$)).subscribe(ids => {
        this.isBookmarked = ids.includes(this.ideaId);
      });
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
    // Optional: Reset tags when leaving the page
    this.seo.generateTags({});
  }

  async submitComment(user: User | null) {
    if (!user || !this.ideaId) return;
    const content = this.newComment.trim();
    if (!content) return;
    await this.commentsService.add(this.ideaId, content, user.uid, user.displayName || 'Anonymous');
    this.analytics.commentAdded(this.ideaId);
    this.newComment = '';
  }

  startEdit(c: Comment, u: User | null) {
    if (!u || u.uid !== c.authorId) return;
    this.editingCommentId = c.id || null;
    this.editContent = c.content;
  }

  cancelEdit() {
    this.editingCommentId = null;
    this.editContent = '';
  }

  async saveEdit(c: Comment, u: User | null) {
    if (!u || u.uid !== c.authorId || !c.id) return;
    const trimmed = this.editContent.trim();
    if (!trimmed) { this.toastService.error('Comment cannot be empty'); return; }
    const original = c.content;
    c.content = trimmed; // optimistic
    try {
      await this.commentsService.update(c.id, trimmed);
      this.toastService.success('Comment updated');
      this.cancelEdit();
    } catch (e) {
      c.content = original; // rollback
      this.toastService.error('Failed to update comment');
      console.error(e);
      this.analytics.actionFailed('comment_update', (e as any)?.message, { idea_id: this.ideaId, comment_id: c.id });
    }
  }

  async deleteComment(c: Comment, u: User | null) {
    if (!u || u.uid !== c.authorId || !c.id) return;
    try {
      await this.commentsService.delete(c.id);
      this.toastService.info('Comment deleted');
      if (this.editingCommentId === c.id) this.cancelEdit();
    } catch (e) {
      this.toastService.error('Failed to delete comment');
      console.error(e);
      this.analytics.actionFailed('comment_delete', (e as any)?.message, { idea_id: this.ideaId, comment_id: c.id });
    }
  }

  canDelete(u: User | null): boolean {
    if (!u || !this.idea) return false;
    // Admins (custom claim) or author can delete
    // Note: token claims not available directly here; UI will show author delete, server rules allow admin too
    return this.idea.authorId === u.uid;
  }

  async deleteIdea(u: User | null) {
    if (!u || !this.ideaId) return;
    if (!this.canDelete(u)) return;
    await this.ideaService.deleteIdea(this.ideaId);
    // Optionally: navigate back after delete
    history.back();
  }

  async moderateDelete(u: User | null) {
    if (!u || !this.ideaId) return;
    await this.moderatorService.moderateDeleteIdea(this.ideaId);
    history.back();
  }

  async toggleBookmark(u: User | null) {
    if (!u || !this.ideaId) return;
    try {
      const res = await this.bookmarkService.toggle(this.ideaId);
      this.isBookmarked = res.bookmarked;
      if (res.bookmarked) {
        this.toastService.success('🔖 Idea bookmarked');
        this.analytics.ideaBookmarked(this.ideaId);
      } else {
        this.toastService.info('Bookmark removed');
      }
    } catch (e) {
      this.toastService.error('Failed to toggle bookmark');
      console.error(e);
      this.analytics.actionFailed('bookmark_toggle', (e as any)?.message, { idea_id: this.ideaId });
    }
  }
}



