import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, limit, collectionData, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

export interface Comment {
  id?: string;
  content: string;
  authorId: string;
  authorName: string;
  ideaId: string;
  createdAt: any;
}

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private firestore = inject(Firestore);

  listForIdea(ideaId: string, limitCount: number = 50): Observable<Comment[]> {
    const ref = collection(this.firestore, 'comments');
    const q = query(ref, where('ideaId', '==', ideaId), orderBy('createdAt', 'desc'), limit(limitCount));
    return collectionData(q, { idField: 'id' }) as Observable<Comment[]>;
  }

  add(ideaId: string, content: string, authorId: string, authorName: string) {
    return addDoc(collection(this.firestore, 'comments'), {
      ideaId,
      content,
      authorId,
      authorName,
      createdAt: serverTimestamp()
    });
  }
}



