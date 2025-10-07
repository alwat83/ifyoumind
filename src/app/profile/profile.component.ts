import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, user, User } from '@angular/fire/auth';
import { Observable, Subject, takeUntil } from 'rxjs';
import { UserService } from '../services/user.service';
import { IdeaService } from '../services/idea.service';
import { IDEA_SEED_DATA } from '../services/idea.seed';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit, OnDestroy {
  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  private userService: UserService = inject(UserService);
  private ideaService: IdeaService = inject(IdeaService);
  private toast: ToastService = inject(ToastService);
  private destroy$ = new Subject<void>();

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
  profilePicPath = '';
  
  // UI state
  isEditing = false;
  isUploading = false;
  uploadCancelled = false;
  uploadError = '';
  selectedFile: File | null = null;
  uploadProgress = 0;
  oldProfilePicUrl = '';
  private uploadController: { cancel: () => void } | null = null;

  // Admin / seeding state
  isAdmin = false;
  seeding = false;
  seedResult: { inserted: number; skipped: number } | null = null;
  removingSeeds = false;
  autoSeedAttempted = false;
  
  // Form data
  editForm = {
    username: '',
    bio: ''
  };

  constructor() {
    this.currentUser$ = user(this.auth);
  }

  ngOnInit() {
    this.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          // Check for custom admin claim
          this.checkAdmin(user);
          // Attempt auto-seed once (admin only) if collection empty
          if (!this.autoSeedAttempted) {
            this.autoSeedAttempted = true;
            setTimeout(() => this.tryAutoSeed(), 0);
          }
          this.userService.getUserProfile(user.uid)
            .pipe(takeUntil(this.destroy$))
            .subscribe(profile => {
              if (profile) {
                this.displayName = profile.displayName || 'User';
                this.username = profile.username || 'user';
                this.bio = profile.bio || '';
                this.totalIdeas = profile.totalIdeas || 0;
                this.totalUpvotes = profile.totalUpvotes || 0;
                this.profilePicUrl = profile.profilePicture || '';
                this.hasProfilePic = !!profile.profilePicture;
                this.oldProfilePicUrl = profile.profilePicture || '';
              }
            });
        }
      });
  }

  private async checkAdmin(user: User) {
    try {
      const tokenResult = await user.getIdTokenResult();
      this.isAdmin = !!tokenResult.claims['admin'];
    } catch (err) {
      console.warn('Failed to read admin claim', err);
      this.isAdmin = false;
    }
  }

  async seedIdeas() {
    if (!this.currentUser) {
      this.toast.error('You must be logged in');
      return;
    }
    if (!this.isAdmin) {
      this.toast.error('Admin only action');
      return;
    }
    if (this.seeding) return;
    this.seeding = true;
    this.seedResult = null;
    try {
      const result = await this.ideaService.seedInitialIdeas(IDEA_SEED_DATA, this.currentUser);
      this.seedResult = result;
      if (result.inserted > 0) {
        this.toast.success(`Seeded ${result.inserted} ideas (${result.skipped} skipped)`);
      } else {
        this.toast.info('No new ideas to seed — all titles already exist');
      }
    } catch (err) {
      console.error('Seeding failed', err);
      this.toast.error('Seeding failed — check console');
    } finally {
      this.seeding = false;
    }
  }

  async removeSeedIdeas() {
    if (!this.currentUser) { this.toast.error('Not logged in'); return; }
    if (!this.isAdmin) { this.toast.error('Admin only'); return; }
    const confirmDelete = confirm('Remove all seeded demo ideas? This cannot be undone.');
    if (!confirmDelete) return;
    this.removingSeeds = true;
    try {
      const removed = await this.ideaService.removeSeedIdeas(this.currentUser);
      this.toast.info(`Removed ${removed} seeded ideas`);
    } catch (e) {
      console.error(e);
      this.toast.error('Failed to remove seeded ideas');
    } finally {
      this.removingSeeds = false;
    }
  }

  private async tryAutoSeed() {
    if (!this.currentUser || !this.isAdmin) return;
    try {
      const res = await this.ideaService.autoSeedIfEmpty(IDEA_SEED_DATA, this.currentUser);
      if (!res.alreadySeeded && res.inserted > 0) {
        this.toast.success(`Auto-seeded ${res.inserted} demo ideas`);
      }
    } catch (e) {
      console.warn('Auto-seed failed (non-fatal)', e);
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }



  startEditing() {
    this.editForm.username = this.username;
    this.editForm.bio = this.bio;
    this.isEditing = true;
  }

  saveProfile() {
    if (!this.currentUser) return;

    const profileData = {
      username: this.editForm.username,
      bio: this.editForm.bio
    };

    this.userService.saveUserProfile(this.currentUser.uid, profileData).subscribe({
      next: () => {
        this.username = this.editForm.username;
        this.bio = this.editForm.bio;
        this.isEditing = false;
        this.toast.success('Profile updated successfully!');
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.toast.error('Error updating profile. Please try again.');
      }
    });
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
    this.uploadCancelled = false;
    this.uploadError = '';
    this.uploadProgress = 0;
    this.uploadController = { cancel: () => {} };

  const oldImageUrl = this.oldProfilePicUrl;
  const oldPath = this.profilePicPath;

    this.userService.uploadProfilePicture(this.selectedFile, this.currentUser.uid, this.uploadController).subscribe({
      next: (progress) => {
        this.uploadProgress = progress.progress;
        if (progress.completed) {
          if (progress.cancelled) {
            this.isUploading = false;
            this.toast.info('Upload cancelled');
            return;
          }
          if (progress.error) {
            this.uploadError = `Upload failed (${progress.code || 'error'}): ${progress.error}`;
            this.isUploading = false;
            return;
          }
          if (progress.url) {
            this.userService.updateProfilePicture(this.currentUser!.uid, progress.url, progress.path, oldImageUrl, oldPath).subscribe({
              next: () => {
                this.profilePicUrl = progress.url!;
                if (progress.path) {
                  this.profilePicPath = progress.path;
                }
                this.hasProfilePic = true;
                this.oldProfilePicUrl = progress.url!;
                this.isUploading = false;
                this.selectedFile = null;
                this.toast.success('Profile picture uploaded successfully!');
              },
              error: (error) => {
                console.error('Error updating profile picture URL:', error);
                this.uploadError = 'Failed to update profile picture URL.';
                this.isUploading = false;
              }
            });
          }
        }
      },
      error: (error) => {
        console.error('Upload error:', error);
        const code = (error && (error.code || error.error?.code)) ? (error.code || error.error.code) : 'unknown';
        this.uploadError = `Upload failed (${code}). Please try again.`;
        this.isUploading = false;
      }
    });
  }

  cancelUpload() {
    if (this.isUploading && this.uploadController) {
      this.uploadController.cancel();
      this.uploadCancelled = true;
    }
  }

  removeProfilePicture() {
    if (!this.currentUser || !this.hasProfilePic) return;
    const confirmDelete = confirm('Remove your profile picture?');
    if (!confirmDelete) return;
    this.userService.removeProfilePicture(this.currentUser.uid, this.profilePicUrl, this.profilePicPath).subscribe({
      next: () => {
        this.profilePicUrl = '';
        this.profilePicPath = '';
        this.hasProfilePic = false;
        this.oldProfilePicUrl = '';
        this.toast.info('Profile picture removed');
      },
      error: (err) => {
        console.error('Failed to remove picture', err);
        this.toast.error('Failed to remove picture');
      }
    });
  }
}