import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import {
  Auth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from '@angular/fire/auth';
import { UserService } from '../../services/user.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage: string | null = null;

  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);
  private userService: UserService = inject(UserService);

  async login() {
    try {
      await signInWithEmailAndPassword(this.auth, this.email, this.password);
      this.router.navigate(['/']);
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
