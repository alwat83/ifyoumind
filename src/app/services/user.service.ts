import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface UserProfile {
  uid: string;
  hasSeenPlatformTour?: boolean;
  displayName?: string;
  id?: string;
  profilePicture?: string;
  hasDismissedChecklist?: boolean;
  hasCompletedOnboarding?: boolean;
  badges?: string[];
  totalIdeas?: number;
  totalComments?: number;
  totalUpvotes?: number;
  interests?: string[];
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor() {}

  initializeUserProfile(user: any): Observable<void> {
    return of(undefined);
  }

  createUserProfile(uid: string, data: any): Promise<void> {
    return Promise.resolve();
  }

  incrementUserIdeaCount(uid: string): Observable<void> {
    return of(undefined);
  }

  updateUserStats(uid: string, stats: any): void {}

  getUserProfile(uid: string): Observable<UserProfile | null> {
    return of({ uid, hasSeenPlatformTour: false });
  }

  getUsers(uids: string[]): Observable<UserProfile[]> {
    return of([]);
  }

  saveUserProfile(uid: string, profileData: any): Observable<void> {
    return of(undefined);
  }

  uploadProfilePicture(file: File, uid: string, controller: any): Observable<any> {
    return of({ progress: 100, completed: true, url: 'mock_url', path: 'mock_path' });
  }

  updateProfilePicture(uid: string, url: string, path: string, oldUrl: string, oldPath: string): Observable<void> {
    return of(undefined);
  }

  removeProfilePicture(uid: string, url: string, path: string): Observable<void> {
    return of(undefined);
  }
}
