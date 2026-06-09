import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  Auth,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
} from '@angular/fire/auth';
import { UserService } from '../../services/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent {
  displayName = '';
  username = '';
  email = '';
  password = '';
  ageVerification = false;
  errorMessage: string | null = null;

  private auth: Auth = inject(Auth);
  private userService: UserService = inject(UserService);
  private router: Router = inject(Router);

  async register() {
    if (!this.ageVerification) {
      this.errorMessage = 'You must confirm you are over 14 to register.';
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        this.email,
        this.password,
      );
      const user = userCredential.user;

      // Force token refresh to sync Auth state with Firestore client before creating profile
      await user.getIdToken(true);

      await updateProfile(user, { displayName: this.displayName });

      try {
        await this.userService.createUserProfile(user.uid, {
          displayName: this.displayName,
          username: this.username,
          email: this.email,
          hasCompletedOnboarding: false,
        });
      } catch (createErr: any) {
        console.error('Failed to create user profile:', createErr);
        this.errorMessage = 'Could not create profile: ' + createErr.message;
        return;
      }

      await sendEmailVerification(user);

      this.router.navigate(['/onboarding']);
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async googleLogin() {
    try {
      const userCredential = await signInWithPopup(
        this.auth,
        new GoogleAuthProvider()
      );
      const user = userCredential.user;

      // Force token refresh to ensure Firestore SDK receives the auth state before querying
      await user.getIdToken(true);

      let userProfile = null;
      try {
        userProfile = await firstValueFrom(
          this.userService.getUserProfile(user.uid)
        );
      } catch (readErr) {
        console.warn('Profile read failed (likely race condition or missing doc):', readErr);
        // Continue with userProfile = null to attempt creation
      }

      if (!userProfile) {
        try {
          await firstValueFrom(this.userService.initializeUserProfile(user));
        } catch (createErr: any) {
          console.error('Failed to initialize user profile:', createErr);
          this.errorMessage = 'Could not create profile: ' + createErr.message;
          return;
        }
        this.router.navigate(['/onboarding']);
      } else {
        this.router.navigate(['/']);
      }
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }
}
