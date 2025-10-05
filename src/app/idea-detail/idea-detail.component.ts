import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';
import { Auth, user, User } from '@angular/fire/auth';
import { Idea } from '../services/idea.service';
import { CommentsService, Comment } from '../services/comments.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-idea-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './idea-detail.component.html',
  styleUrls: ['./idea-detail.component.scss']
})
export class IdeaDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private firestore = inject(Firestore);
  private commentsService = inject(CommentsService);
  private auth = inject(Auth);

  ideaId = '';
  idea: Idea | null = null;
  comments$: Observable<Comment[]> | null = null;
  newComment = '';
  currentUser$ = user(this.auth);

  async ngOnInit() {
    this.ideaId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.ideaId) return;
    const ref = doc(this.firestore, 'ideas', this.ideaId);
    const snap = await getDoc(ref);
    this.idea = ({ id: this.ideaId, ...(snap.data() as any) } as unknown) as Idea;
    this.comments$ = this.commentsService.listForIdea(this.ideaId, 100);
  }

  async submitComment(user: User | null) {
    if (!user || !this.ideaId) return;
    const content = this.newComment.trim();
    if (!content) return;
    await this.commentsService.add(this.ideaId, content, user.uid, user.displayName || 'Anonymous');
    this.newComment = '';
  }
}



