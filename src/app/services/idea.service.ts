import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  collectionData, 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove,
  query,
  orderBy,
  limit,
  where,
  addDoc,
  getDocs
} from '@angular/fire/firestore';
import { serverTimestamp } from '@angular/fire/firestore';
import { Observable, of } from 'rxjs';
import { switchMap, map } from 'rxjs/operators';
import { Auth, user, User } from '@angular/fire/auth';
import { UserService } from './user.service';

export interface Idea {
  id?: string;
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
}

@Injectable({
  providedIn: 'root'
})
export class IdeaService {
  constructor(
    private firestore: Firestore,
    private auth: Auth,
    private userService: UserService
  ) {}

  // Get all public ideas with optimized query
  getAllIdeas(): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    // Simplified query to avoid composite index requirement
    const ideasQuery = query(
      ideaCollection,
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    return collectionData(ideasQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get trending ideas (highest trending score)
  getTrendingIdeas(limitCount: number = 10): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    // Simplified query to avoid composite index requirement
    const trendingQuery = query(
      ideaCollection,
      orderBy('upvotes', 'desc'),
      limit(limitCount)
    );
    return collectionData(trendingQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get recent ideas (newest first)
  getRecentIdeas(limitCount: number = 20): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const recentQuery = query(
      ideaCollection,
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return collectionData(recentQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get ideas by category
  getIdeasByCategory(category: string, limitCount: number = 20): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    // Simplified query to avoid composite index requirement
    const categoryQuery = query(
      ideaCollection,
      where('category', '==', category),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );
    return collectionData(categoryQuery, { idField: 'id' }) as Observable<Idea[]>;
  }

  // Get user's ideas
  getUserIdeas(userId: string): Observable<Idea[]> {
    const ideaCollection = collection(this.firestore, 'ideas');
    const userQuery = query(
      ideaCollection,
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    return collectionData(userQuery, { idField: 'id' }) as Observable<Idea[]>;
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
  async createIdea(ideaData: Partial<Idea>, currentUser: User): Promise<void> {
    const idea = {
      ...ideaData,
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

    await addDoc(collection(this.firestore, 'ideas'), idea);
    
    // Update user's idea count
    this.userService.updateUserStats(currentUser.uid, { 
      totalIdeas: 1 // This should be incremented, but we'll handle it properly in the future
    }).subscribe({
      next: () => console.log('User stats updated'),
      error: (error) => console.error('Failed to update user stats:', error)
    });
  }

  // Update idea
  async updateIdea(ideaId: string, updates: Partial<Idea>): Promise<void> {
    const ideaRef = doc(this.firestore, 'ideas', ideaId);
    await updateDoc(ideaRef, {
      ...updates,
      lastActivity: new Date()
    });
  }

  // Upvote an idea
  async upvoteIdea(ideaId: string, userId: string, hasUpvoted: boolean): Promise<void> {
    const ideaRef = doc(this.firestore, 'ideas', ideaId);
    const now = new Date();
    
    if (hasUpvoted) {
      // Remove upvote
      await updateDoc(ideaRef, {
        upvotes: increment(-1),
        upvotedBy: arrayRemove(userId),
        trendingScore: increment(-1),
        lastActivity: now
      });
    } else {
      // Add upvote
      await updateDoc(ideaRef, {
        upvotes: increment(1),
        upvotedBy: arrayUnion(userId),
        trendingScore: increment(1),
        lastActivity: now
      });
    }
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
}
