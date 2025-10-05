import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, user, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Storage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from '@angular/fire/storage';
import { Observable, from, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private firestore: Firestore = inject(Firestore);
  private storage: Storage = inject(Storage);
  private router: Router = inject(Router);

  currentUser$: Observable<User | null>;
  currentUser: User | null = null;
  
  // Simple properties
  displayName = '';
  username = '';
  bio = '';
  totalIdeas = 0;
  totalUpvotes = 0;
  hasProfilePic = false;
  profilePicUrl = '';
  
  // UI state
  isEditing = false;
  isUploading = false;
  uploadError = '';
  selectedFile: File | null = null;
  uploadProgress = 0;
  oldProfilePicUrl = '';
  
  // Form data
  editForm = {
    username: '',
    bio: ''
  };

  constructor() {
    this.currentUser$ = user(this.auth);
  }

  ngOnInit() {
    this.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUserProfile(user.uid);
      }
    });
  }

  async loadUserProfile(uid: string) {
    const isProduction = this.isProductionEnvironment();
    
    if (!isProduction) {
      // Local development mode - use mock data
      this.loadMockProfile();
      return;
    }

    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        this.displayName = userData['displayName'] || this.currentUser?.displayName || 'User';
        this.username = userData['username'] || this.currentUser?.displayName?.toLowerCase().replace(/\s+/g, '') || 'user';
        this.bio = userData['bio'] || '';
        this.totalIdeas = userData['totalIdeas'] || 0;
        this.totalUpvotes = userData['totalUpvotes'] || 0;
        this.hasProfilePic = !!userData['profilePicture'];
        this.profilePicUrl = userData['profilePicture'] || '';
        this.oldProfilePicUrl = userData['profilePicture'] || '';
      } else {
        // Create new user profile
        await this.initializeUserProfile();
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
      this.loadMockProfile();
    }
  }

  private loadMockProfile() {
    if (!this.currentUser) return;
    
    this.displayName = this.currentUser.displayName || 'User';
    this.username = this.currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'user';
    this.bio = 'This is a demo profile for local development';
    this.totalIdeas = Math.floor(Math.random() * 10);
    this.totalUpvotes = Math.floor(Math.random() * 50);
    this.hasProfilePic = false;
    this.profilePicUrl = '';
    this.oldProfilePicUrl = '';
    
    console.log('Loaded mock profile for local development');
  }

  async initializeUserProfile() {
    if (!this.currentUser) return;
    
    this.displayName = this.currentUser.displayName || 'User';
    this.username = this.currentUser.displayName?.toLowerCase().replace(/\s+/g, '') || 'user';
    this.bio = '';
    this.totalIdeas = 0;
    this.totalUpvotes = 0;
    this.hasProfilePic = false;
    this.profilePicUrl = '';
    this.oldProfilePicUrl = '';

    try {
      const userDocRef = doc(this.firestore, 'users', this.currentUser.uid);
      await setDoc(userDocRef, {
        uid: this.currentUser.uid,
        displayName: this.displayName,
        username: this.username,
        bio: this.bio,
        totalIdeas: this.totalIdeas,
        totalUpvotes: this.totalUpvotes,
        profilePicture: '',
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Error initializing user profile:', error);
    }
  }

  startEditing() {
    this.editForm.username = this.username;
    this.editForm.bio = this.bio;
    this.isEditing = true;
  }

  async saveProfile() {
    if (!this.currentUser) return;
    
    const isProduction = this.isProductionEnvironment();
    
    try {
      this.username = this.editForm.username;
      this.bio = this.editForm.bio;
      
      if (isProduction) {
        const userDocRef = doc(this.firestore, 'users', this.currentUser.uid);
        await updateDoc(userDocRef, {
          username: this.username,
          bio: this.bio,
          updatedAt: new Date()
        });
      }
      
      this.isEditing = false;
      const message = isProduction 
        ? 'Profile updated successfully!' 
        : 'Profile updated successfully! (Demo Mode - not persisted)';
      alert(message);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile. Please try again.');
    }
  }

  cancelEditing() {
    this.isEditing = false;
  }

  goBack() {
    this.router.navigate(['/']);
  }

  getUserInitial(): string {
    return this.displayName.charAt(0).toUpperCase() || 'U';
  }

  clearSelectedFile() {
    this.selectedFile = null;
    this.uploadError = '';
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Basic validation
      if (!file.type.startsWith('image/')) {
        this.uploadError = 'Please select an image file';
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.uploadError = 'File size must be less than 5MB';
        return;
      }

      this.selectedFile = file;
      this.uploadError = '';
    }
  }

  async uploadProfilePicture() {
    if (!this.selectedFile || !this.currentUser) return;

    this.isUploading = true;
    this.uploadError = '';
    this.uploadProgress = 0;

    // Check if we're running in production (has proper Firebase config)
    const isProduction = this.isProductionEnvironment();

    if (!isProduction) {
      // Local development mode - use demo upload
      await this.demoUpload();
    } else {
      // Production mode - use Firebase Storage
      await this.productionUpload();
    }
  }

  private isProductionEnvironment(): boolean {
    // Check if we have proper Firebase Storage configuration
    try {
      // Try to create a test reference to see if Storage is properly configured
      const testRef = ref(this.storage, 'test');
      return true;
    } catch (error) {
      console.log('Running in local development mode - using demo upload');
      return false;
    }
  }

  private async demoUpload() {
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        this.uploadProgress = i;
      }

      // Compress the image for demo
      if (!this.selectedFile) {
        throw new Error('No file selected');
      }
      const compressedFile = await this.compressImage(this.selectedFile);
      
      // Create local URL for demo
      const downloadURL = URL.createObjectURL(compressedFile);
      
      // Update component state
      this.hasProfilePic = true;
      this.profilePicUrl = downloadURL;
      this.oldProfilePicUrl = downloadURL;
      this.selectedFile = null;
      this.uploadProgress = 0;
      this.isUploading = false;
      
      alert('Profile picture uploaded successfully! (Demo Mode - not persisted)');
    } catch (error) {
      console.error('Demo upload error:', error);
      this.uploadError = 'Demo upload failed. Please try again.';
      this.isUploading = false;
    }
  }

  private async productionUpload() {
    try {
      // Compress the image
      if (!this.selectedFile) {
        throw new Error('No file selected');
      }
      const compressedFile = await this.compressImage(this.selectedFile);
      
      // Create storage reference
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }
      
      const timestamp = Date.now();
      const fileName = `avatar_${timestamp}.jpg`;
      const storageRef = ref(this.storage, `profile-pictures/${this.currentUser.uid}/${fileName}`);
      
      // Upload file with progress tracking
      const uploadTask = uploadBytesResumable(storageRef, compressedFile);
      
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking
          this.uploadProgress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
        },
        (error) => {
          // Handle upload error
          console.error('Upload error:', error);
          this.uploadError = 'Upload failed. Please try again.';
          this.isUploading = false;
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Update user profile with new picture URL
            if (!this.currentUser) {
              throw new Error('User not authenticated');
            }
            
            const userDocRef = doc(this.firestore, 'users', this.currentUser.uid);
            await updateDoc(userDocRef, {
              profilePicture: downloadURL,
              updatedAt: new Date()
            });
            
            // Delete old profile picture if it exists
            if (this.oldProfilePicUrl && this.oldProfilePicUrl !== downloadURL) {
              try {
                const oldImageRef = ref(this.storage, this.oldProfilePicUrl);
                await deleteObject(oldImageRef);
              } catch (deleteError) {
                console.warn('Could not delete old profile picture:', deleteError);
              }
            }
            
            // Update component state
            this.hasProfilePic = true;
            this.profilePicUrl = downloadURL;
            this.oldProfilePicUrl = downloadURL;
            this.selectedFile = null;
            this.uploadProgress = 0;
            this.isUploading = false;
            
            alert('Profile picture uploaded successfully!');
          } catch (error) {
            console.error('Error updating profile with new picture:', error);
            this.uploadError = 'Picture uploaded but failed to update profile. Please refresh the page.';
            this.isUploading = false;
          }
        }
      );
    } catch (error) {
      console.error('Error during upload process:', error);
      this.uploadError = 'Upload failed. Please try again.';
      this.isUploading = false;
    }
  }

  private async compressImage(file: File): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions (max 400px)
        const maxSize = 400;
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = (width * maxSize) / height;
            height = maxSize;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.8);
      };
      
      img.src = URL.createObjectURL(file);
    });
  }
}