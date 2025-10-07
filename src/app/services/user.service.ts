import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  collectionData,
  query,
  where,
  orderBy,
  limit,
  docData
} from '@angular/fire/firestore';
import { 
  Storage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject
} from '@angular/fire/storage';
import { Auth, User } from '@angular/fire/auth';
import { Observable, from, switchMap, of } from 'rxjs';
import { increment } from '@angular/fire/firestore';

export interface UserProfile {
  id?: string;
  displayName: string;
  email: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
  profilePicturePath?: string;
  createdAt: Date;
  lastLogin?: Date;
  isPublic?: boolean;
  totalIdeas?: number;
  totalUpvotes?: number;
}

export interface UploadProgress {
  progress: number;
  completed: boolean;
  url?: string;
  path?: string;
  error?: string;
  code?: string;
  cancellable?: boolean;
  cancelled?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);
  private auth: Auth = inject(Auth);

  /**
   * Get user profile from Firestore
   */
  getUserProfile(userId: string): Observable<UserProfile | null> {
    const userDoc = doc(this.firestore, 'users', userId);
    // Use docData (AngularFire aware) to avoid outside injection context warnings
    return docData(userDoc, { idField: 'id' }).pipe(
      switchMap((data: any) => {
        if (data) {
          return of({
            ...data,
            createdAt: data['createdAt']?.toDate ? data['createdAt'].toDate() : data['createdAt'] || new Date(),
            lastLogin: data['lastLogin']?.toDate ? data['lastLogin'].toDate() : data['lastLogin']
          } as UserProfile);
        }
        return of(null);
      })
    );
  }

  /**
   * Create or update user profile
   */
  saveUserProfile(userId: string, profile: Partial<UserProfile>): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    const profileData = {
      ...profile,
      lastLogin: new Date()
    };
    
    return from(setDoc(userDoc, profileData, { merge: true }));
  }

  /**
   * Upload profile picture with progress tracking
   */
  uploadProfilePicture(file: File, userId: string, controller?: { cancel: () => void }): Observable<UploadProgress> {
    if (!this.validateImageFile(file)) {
      return of({ progress: 0, completed: true, error: 'Invalid file type or size' });
    }

    const performUpload = (inputFile: File, attempt: number): Observable<UploadProgress> => {
      const timestamp = Date.now();
      const fileName = `avatar_${timestamp}_${attempt}.${this.getFileExtension(inputFile.name)}`;
      const storageRef = ref(this.storage, `profile-pictures/${userId}/${fileName}`);

      return new Observable<UploadProgress>(observer => {
      let lastPercent = 0;
      observer.next({ progress: 0, completed: false, cancellable: true });
      try {
        const task = uploadBytesResumable(storageRef, inputFile, { contentType: inputFile.type, cacheControl: 'public,max-age=3600' });
        if (controller) {
          controller.cancel = () => {
            try { task.cancel(); } catch {}
          };
        }
        task.on('state_changed', (snapshot) => {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          // Throttle UI updates a bit
          if (pct !== lastPercent) {
            lastPercent = pct;
            observer.next({ progress: pct, completed: false });
          }
        }, (error) => {
          console.error('Resumable upload error:', error);
          const code = (error && (error.code || error['message'])) ? (error.code || 'unknown') : 'unknown';
          if (code === 'storage/canceled') {
            observer.next({ progress: lastPercent, completed: true, cancelled: true, code });
            observer.complete();
            return;
          }
          // Retry once for transient errors
          if (attempt === 0 && ['storage/retry-limit-exceeded','storage/unknown','storage/quota-exceeded'].includes(code) === false) {
            console.warn('Retrying upload (single retry policy)...');
            performUpload(inputFile, 1).subscribe(observer);
            return;
          }
          observer.next({ progress: lastPercent, completed: true, error: error.message || 'Upload failed', code });
          observer.complete();
        }, async () => {
          try {
            const url = await getDownloadURL(storageRef);
            observer.next({ progress: 100, completed: true, url, path: storageRef.fullPath });
            observer.complete();
          } catch (err: any) {
            console.error('Download URL error after upload:', err);
            observer.next({ progress: 100, completed: true, error: err.message || 'Failed to get download URL', code: err.code || 'url_error' });
            observer.complete();
          }
        });
      } catch (err: any) {
        observer.next({ progress: 0, completed: true, error: err.message || 'Unexpected upload error', code: err.code || 'unexpected' });
        observer.complete();
      }
      });
    };

    // Compress if larger than 800KB
    const shouldCompress = file.size > 800 * 1024;
    if (shouldCompress) {
      return new Observable<UploadProgress>(observer => {
        this.compressImage(file, 600, 0.8)
          .then(compressed => {
            performUpload(compressed, 0).subscribe(observer);
          })
          .catch(err => {
            console.warn('Compression failed, uploading original', err);
            performUpload(file, 0).subscribe(observer);
          });
      });
    }
    return performUpload(file, 0);
  }

  /**
   * Delete old profile picture and update user profile
   */
  updateProfilePicture(userId: string, newImageUrl: string, newPath: string | undefined, oldImageUrl?: string, oldPath?: string): Observable<void> {
    return new Observable<void>(observer => {
      // Delete old image if it exists
      if (oldImageUrl || oldPath) {
        this.deleteProfilePicture(oldPath || oldImageUrl!).subscribe({
          next: () => {
            // Update user profile with new URL
            this.saveUserProfile(userId, { profilePicture: newImageUrl, profilePicturePath: newPath }).subscribe({
              next: () => observer.next(),
              error: (err) => observer.error(err)
            });
          },
          error: () => {
            // Continue with profile update even if deletion fails
            this.saveUserProfile(userId, { profilePicture: newImageUrl, profilePicturePath: newPath }).subscribe({
              next: () => observer.next(),
              error: (err) => observer.error(err)
            });
          }
        });
      } else {
        // Just update the profile
        this.saveUserProfile(userId, { profilePicture: newImageUrl, profilePicturePath: newPath }).subscribe({
          next: () => observer.next(),
          error: (err) => observer.error(err)
        });
      }
    });
  }

  /**
   * Delete profile picture from storage
   */
  private deleteProfilePicture(imageUrlOrPath: string): Observable<void> {
    try {
      let path = imageUrlOrPath;
      if (imageUrlOrPath.startsWith('http')) {
        const match = imageUrlOrPath.match(/\/o\/([^?]+)\?/);
        if (match && match[1]) {
          path = decodeURIComponent(match[1]);
        }
      }
      const imageRef = ref(this.storage, path);
      return from(deleteObject(imageRef));
    } catch {
      return of(void 0); // Silent fallback
    }
  }

  /** Remove avatar: delete file if path known then clear profile fields */
  removeProfilePicture(userId: string, imageUrl?: string, path?: string): Observable<void> {
    return new Observable<void>(observer => {
      if (path || imageUrl) {
        this.deleteProfilePicture(path || imageUrl!).subscribe({
          next: () => {
            this.saveUserProfile(userId, { profilePicture: '', profilePicturePath: '' }).subscribe({
              next: () => { observer.next(); observer.complete(); },
              error: (err) => observer.error(err)
            });
          },
          error: () => {
            // proceed anyway
            this.saveUserProfile(userId, { profilePicture: '', profilePicturePath: '' }).subscribe({
              next: () => { observer.next(); observer.complete(); },
              error: (err) => observer.error(err)
            });
          }
        });
      } else {
        this.saveUserProfile(userId, { profilePicture: '', profilePicturePath: '' }).subscribe({
          next: () => { observer.next(); observer.complete(); },
          error: (err) => observer.error(err)
        });
      }
    });
  }

  /**
   * Get all users (for public profiles)
   */
  getAllUsers(): Observable<UserProfile[]> {
    const usersCollection = collection(this.firestore, 'users');
    const publicUsersQuery = query(
      usersCollection,
      where('isPublic', '==', true),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    return collectionData(publicUsersQuery) as Observable<UserProfile[]>;
  }

  /**
   * Update user statistics
   */
  updateUserStats(userId: string, stats: { totalIdeas?: number; totalUpvotes?: number }): Observable<void> {
    const userDoc = doc(this.firestore, 'users', userId);
    return from(updateDoc(userDoc, stats));
  }

  /**
   * Atomically increment totalIdeas; if doc missing create minimal placeholder.
   */
  incrementUserIdeaCount(userId: string): Observable<void> {
    const userDocRef = doc(this.firestore, 'users', userId);
    return new Observable<void>(observer => {
      updateDoc(userDocRef, { totalIdeas: increment(1) })
        .then(() => { observer.next(); observer.complete(); })
        .catch(async () => {
          try {
            await setDoc(userDocRef, { totalIdeas: 1, totalUpvotes: 0, createdAt: new Date(), displayName: 'User', email: '' }, { merge: true });
            observer.next();
            observer.complete();
          } catch (err) {
            observer.error(err);
          }
        });
    });
  }

  /**
   * Initialize user profile on first login
   */
  initializeUserProfile(user: User): Observable<void> {
    const profileData: Partial<UserProfile> = {
      displayName: user.displayName || 'Anonymous User',
      email: user.email || '',
      createdAt: new Date(),
      lastLogin: new Date(),
      isPublic: true,
      totalIdeas: 0,
      totalUpvotes: 0
    };

    return this.saveUserProfile(user.uid, profileData);
  }

  /**
   * Validate image file
   */
  private validateImageFile(file: File): boolean {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!allowedTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  }

  /**
   * Get file extension
   */
  private getFileExtension(filename: string): string {
    return filename.split('.').pop() || 'jpg';
  }

  /**
   * Compress image before upload
   */
  compressImage(file: File, maxWidth = 400, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now()
              });
              resolve(compressedFile);
            } else {
              reject(new Error('Failed to compress image'));
            }
          },
          'image/jpeg',
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}




