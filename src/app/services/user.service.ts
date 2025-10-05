import { Injectable, inject } from '@angular/core';
import { 
  Firestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collectionData,
  query,
  where,
  orderBy,
  limit
} from '@angular/fire/firestore';
import { 
  Storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  uploadBytesResumable,
  percentage
} from '@angular/fire/storage';
import { Auth, User } from '@angular/fire/auth';
import { Observable, from, switchMap, of } from 'rxjs';

export interface UserProfile {
  id?: string;
  displayName: string;
  email: string;
  username?: string;
  bio?: string;
  profilePicture?: string;
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
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(
    private firestore: Firestore,
    private storage: Storage,
    private auth: Auth
  ) {}

  /**
   * Get user profile from Firestore
   */
  getUserProfile(userId: string): Observable<UserProfile | null> {
    const userDoc = doc(this.firestore, 'users', userId);
    return from(getDoc(userDoc)).pipe(
      switchMap(doc => {
        if (doc.exists()) {
          const data = doc.data();
          return of({
            id: doc.id,
            ...data,
            createdAt: data['createdAt']?.toDate() || new Date(),
            lastLogin: data['lastLogin']?.toDate()
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
  uploadProfilePicture(file: File, userId: string): Observable<UploadProgress> {
    // Validate file
    if (!this.validateImageFile(file)) {
      return of({ progress: 0, completed: true, error: 'Invalid file type or size' });
    }

    // Create storage reference
    const timestamp = Date.now();
    const fileName = `avatar_${timestamp}.${this.getFileExtension(file.name)}`;
    const storageRef = ref(this.storage, `profile-pictures/${userId}/${fileName}`);

    // Upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Observable<UploadProgress>(observer => {
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          observer.next({ progress, completed: false });
        },
        (error) => {
          console.error('Upload error:', error);
          observer.next({ progress: 0, completed: true, error: error.message });
        },
        async () => {
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            observer.next({ progress: 100, completed: true, url: downloadURL });
            observer.complete();
          } catch (error) {
            observer.next({ progress: 0, completed: true, error: 'Failed to get download URL' });
          }
        }
      );
    });
  }

  /**
   * Delete old profile picture and update user profile
   */
  updateProfilePicture(userId: string, newImageUrl: string, oldImageUrl?: string): Observable<void> {
    return new Observable<void>(observer => {
      // Delete old image if it exists
      if (oldImageUrl) {
        this.deleteProfilePicture(oldImageUrl).subscribe({
          next: () => {
            // Update user profile with new URL
            this.saveUserProfile(userId, { profilePicture: newImageUrl }).subscribe({
              next: () => observer.next(),
              error: (error) => observer.error(error)
            });
          },
          error: (error) => {
            console.warn('Failed to delete old image:', error);
            // Continue with profile update even if deletion fails
            this.saveUserProfile(userId, { profilePicture: newImageUrl }).subscribe({
              next: () => observer.next(),
              error: (error) => observer.error(error)
            });
          }
        });
      } else {
        // Just update the profile
        this.saveUserProfile(userId, { profilePicture: newImageUrl }).subscribe({
          next: () => observer.next(),
          error: (error) => observer.error(error)
        });
      }
    });
  }

  /**
   * Delete profile picture from storage
   */
  private deleteProfilePicture(imageUrl: string): Observable<void> {
    try {
      const imageRef = ref(this.storage, imageUrl);
      return from(deleteObject(imageRef));
    } catch (error) {
      return of(void 0); // Return empty observable if deletion fails
    }
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
  compressImage(file: File, maxWidth: number = 400, quality: number = 0.8): Promise<File> {
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



