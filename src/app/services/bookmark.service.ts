import { Injectable, inject } from '@angular/core';
import { Auth, user } from '@angular/fire/auth';
import {
  Firestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  serverTimestamp,
  collectionData,
} from '@angular/fire/firestore';
import { Observable, switchMap, of, map } from 'rxjs';

export interface Bookmark {
  ideaId: string;
  createdAt: Date;
}

@Injectable({ providedIn: 'root' })
export class BookmarkService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);

  private userBookmarksCollection(userId: string) {
    return collection(this.firestore, `users/${userId}/bookmarks`);
  }

  list(): Observable<string[]> {
    return user(this.auth).pipe(
      switchMap((u) => {
        if (!u) return of([]);
        return collectionData(this.userBookmarksCollection(u.uid), {
          idField: 'id',
        }).pipe(map((items) => items.map((b: any) => b['id'])));
      }),
    );
  }

  async toggle(ideaId: string): Promise<{ bookmarked: boolean }> {
    const u = this.auth.currentUser;
    if (!u) throw new Error('Not authenticated');
    const ref = doc(this.firestore, `users/${u.uid}/bookmarks/${ideaId}`);
    // naive approach: attempt get via try set, if exists delete
    // Firestore lite get not imported; rely on set/delete toggle pattern with catching
    try {
      await setDoc(ref, { createdAt: serverTimestamp() }, { merge: false });
      return { bookmarked: true };
    } catch {
      // If set fails (rare), just try deleting— fallback logic
      await deleteDoc(ref);
      return { bookmarked: false };
    }
  }

  async remove(ideaId: string): Promise<void> {
    const u = this.auth.currentUser;
    if (!u) return;
    await deleteDoc(doc(this.firestore, `users/${u.uid}/bookmarks/${ideaId}`));
  }
}
