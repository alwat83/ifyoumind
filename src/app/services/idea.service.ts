import { Injectable, inject } from '@angular/core';
import { UserService } from './user.service';
import { 
  Firestore,
  collection,
  query,
  orderBy,
  limit,
  where,
  collectionData,
  addDoc,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  startAfter,
  QueryConstraint,
  getDocs as fetchDocs
} from '@angular/fire/firestore';
import { Auth, User } from '@angular/fire/auth';
import { httpsCallable, Functions } from '@angular/fire/functions';
import { Observable, map } from 'rxjs';

export interface Idea {
  id?: string;
  title?: string;
  problem: string;
  solution: string;
  impact: string;
  createdAt: Date;
  upvotes: number;
  upvotedBy: string[];
  authorId: string;
  authorName: string;
  tags?: string[];
  category?: string;
  trendingScore?: number;
  lastActivity?: Date;
  isPublic?: boolean;
  /** Mark ideas that were inserted by seeding so they can be removed later */
  __seed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class IdeaService {
  private firestore: Firestore = inject(Firestore);
  private auth: Auth = inject(Auth);
  private userService: UserService = inject(UserService);
  private functions: Functions = inject(Functions);

  // Get all public ideas with optimized query
  getAllIdeas(): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    // Simplified query to avoid composite index requirement
    const ideasQuery = query(
      ideaCollection,
      where('isPublic','==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return collectionData(ideasQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get trending ideas (highest trending score)
  getTrendingIdeas(limitCount = 10): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    // Simplified query to avoid composite index requirement
    const trendingQuery = query(
      ideaCollection,
      where('isPublic','==', true),
      orderBy('upvotes', 'desc'),
      limit(limitCount)
    );
    return collectionData(trendingQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get recent ideas (newest first)
  getRecentIdeas(limitCount = 20): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const recentQuery = query(
      ideaCollection,
      where('isPublic','==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return collectionData(recentQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  /** Paged fetch (non-reactive) for infinite scroll */
  async getRecentIdeasPage(pageSize: number, cursor?: any, category?: string): Promise<{ ideas: Idea[]; nextCursor?: any }> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const constraints: QueryConstraint[] = [];
    constraints.push(where('isPublic','==', true));
    if (category && category !== 'all') {
      constraints.push(where('category', '==', category));
    }
    constraints.push(orderBy('createdAt', 'desc'), limit(pageSize));
    if (cursor) constraints.push(startAfter(cursor));
    const q = query(ideaCollection, ...constraints);
    const snap = await fetchDocs(q);
    const ideas: Idea[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
    const nextCursor = snap.docs.length === pageSize ? snap.docs[snap.docs.length - 1] : undefined;
    return { ideas, nextCursor };
  }

  // Get ideas by category
  getIdeasByCategory(category: string, limitCount = 20): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    // Simplified query to avoid composite index requirement
    const categoryQuery = query(
      ideaCollection,
      where('category', '==', category),
      where('isPublic','==', true),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return collectionData(categoryQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get user's submitted ideas
  getUserIdeas(userId: string): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const userQuery = query(
      ideaCollection,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(userQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get user's upvoted ideas
  getUpvotedIdeasByUser(userId: string): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const upvotedQuery = query(
      ideaCollection,
      where('upvotedBy', 'array-contains', userId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(upvotedQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Search ideas by text (problem, solution, impact)
  searchIdeas(searchTerm: string): Observable<Idea[]> {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation - for production, consider Algolia or Elasticsearch
    return this.getAllIdeas().pipe(
      map(ideas => ideas.filter(idea => 
        idea.problem.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.solution.toLowerCase().includes(searchTerm.toLowerCase()) ||
        idea.impact.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
  }

  // Create a new idea
  async createIdea(ideaData: Partial<Idea>, currentUser: User): Promise<{ id: string } | void> {
    const idea = {
      ...ideaData,
      title: ideaData.title || 'Untitled Idea',
      createdAt: serverTimestamp(),
      upvotes: 0,
      upvotedBy: [],
      authorId: currentUser.uid,
      authorName: currentUser.displayName || 'Anonymous',
      tags: ideaData.tags || [],
      category: ideaData.category || 'general',
      trendingScore: 0,
      lastActivity: serverTimestamp(),
      isPublic: ideaData.isPublic !== false // Default to true
    };

  const docRef = await addDoc(collection(this.firestore, 'ideas'), idea);
    // Atomically increment user's idea count (fallback create if missing)
    this.userService.incrementUserIdeaCount(currentUser.uid).subscribe({
      next: () => console.log('User totalIdeas incremented'),
      error: (error: unknown) => console.error('Failed to increment user idea count:', error)
    });
    return { id: docRef.id };
  }

  // Update idea
  async updateIdea(ideaId: string, updates: Partial<Idea>): Promise<void> {
    const ideaRef = doc(this.firestore, 'ideas', ideaId);
    await updateDoc(ideaRef, {
      ...updates,
      lastActivity: new Date()
    });
  }

  // Delete idea
  async deleteIdea(ideaId: string): Promise<void> {
    const ideaRef = doc(this.firestore, 'ideas', ideaId);
    await deleteDoc(ideaRef);
  }

  // Upvote an idea
  async upvoteIdea(ideaId: string): Promise<{ upvoted: boolean; upvotes: number } | void> {
    const callable = httpsCallable<{ ideaId: string }, { upvoted: boolean; upvotes: number }>(this.functions, 'toggleUpvote');
    const res = await callable({ ideaId });
    if (res.data.upvoted) {
      const userId = this.auth.currentUser?.uid;
      if (userId) {
        this.userService.updateUserStats(userId, { totalUpvotes: 1 });
      }
    }
    return res.data;
  }

  // Get available categories
  async getCategories(): Promise<string[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const snapshot = await getDocs(ideaCollection);
    const categories = new Set<string>();
    
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data['category']) {
        categories.add(data['category']);
      }
    });
    
    return Array.from(categories);
  }

  // Calculate trending score (can be called periodically)
  calculateTrendingScore(idea: Idea): number {
    const now = new Date();
    const createdAt = idea.createdAt instanceof Date ? idea.createdAt : new Date(idea.createdAt);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    // Simple trending algorithm: upvotes / (hours + 1)
    // This gives newer ideas a boost while still rewarding popular content
    return idea.upvotes / (hoursSinceCreation + 1);
  }

  /** Seed initial ideas if they don't already exist (by title). Returns inserted count. */
  async seedInitialIdeas(seedData: Partial<Idea>[], currentUser: User): Promise<{ inserted: number; skipped: number; }> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const existingTitles = new Set<string>();
    let inserted = 0; let skipped = 0;
    for (const seed of seedData) {
      const rawTitle = seed.title || '';
      const titleKey = rawTitle.toLowerCase().trim();
      if (!titleKey) { skipped++; continue; }
      // Query for existing idea with same title (public ones only to satisfy rules)
      try {
        if (!existingTitles.has(titleKey)) {
          const titleQuery = query(ideaCollection, where('title', '==', rawTitle), limit(1));
          const snap = await getDocs(titleQuery);
          if (!snap.empty) {
            existingTitles.add(titleKey);
            skipped++;
            continue;
          }
        } else {
          skipped++; continue;
        }
      } catch (e) {
        console.warn('[SEED] Title lookup failed, proceeding without duplicate guard', rawTitle, e);
      }
      try {
        await this.createIdea({ ...seed, __seed: true }, currentUser);
        existingTitles.add(titleKey);
        inserted++;
      } catch (err) {
        console.error('Seed insert failed for', seed.title, err);
        skipped++;
      }
    }
    return { inserted, skipped };
  }

  /** Remove all seed-tagged ideas (admin-only in UI). Returns count removed. */
  async removeSeedIdeas(currentUser: User): Promise<number> {
    const ideaCollectionRef = collection(this.firestore, 'ideas');
    // Query for documents with __seed: true. This is still subject to security rules.
    // If rules require other fields (like isPublic), this query might fail or return partial results.
    const q = query(ideaCollectionRef, where('__seed', '==', true), where('isPublic', '==', true));
    const snap = await getDocs(q);
    let removed = 0;
    for (const d of snap.docs) {
      try {
        await deleteDoc(d.ref);
        removed++;
      } catch (e) {
        console.warn('Failed deleting seed doc', d.id, e);
      }
    }
    return removed;
  }

  /** Auto-seed if collection empty and user is admin. No meta marker (simplified). */
  async autoSeedIfEmpty(seedData: Partial<Idea>[], currentUser: User): Promise<{ inserted: number; skipped: number; alreadySeeded: boolean; }> {
    const token = await currentUser.getIdTokenResult();
    if (!token.claims['admin']) {
      return { inserted: 0, skipped: 0, alreadySeeded: true };
    }
    const ideaCollectionRef = collection(this.firestore, 'ideas');
    // Only check for a single public idea to avoid private doc read failures
    try {
      const publicOne = await getDocs(query(ideaCollectionRef, where('isPublic','==', true), limit(1)));
      if (!publicOne.empty) {
        return { inserted: 0, skipped: publicOne.size, alreadySeeded: true };
      }
    } catch (e) {
      console.warn('[AUTO-SEED] Public idea probe failed, aborting auto-seed', e);
      return { inserted: 0, skipped: 0, alreadySeeded: true };
    }
    console.info('[AUTO-SEED] No ideas found. Seeding now...');
    const result = await this.seedInitialIdeas(seedData, currentUser);
    console.info('[AUTO-SEED] Completed', result);
    return { ...result, alreadySeeded: false };
  }
}
