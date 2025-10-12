import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Auth, sendEmailVerification, User } from '@angular/fire/auth';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent {
  isResending = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  async resendVerificationEmail() {
    this.isResending = true;
    this.message = null;

    const user = this.auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        this.message = {
          type: 'success',
          text: 'A new verification email has been sent.',
        };
      } catch (error) {
        this.message = {
          type: 'error',
          text: 'An error occurred while sending the email. Please try again.',
        };
      }
    } else {
      this.message = { type: 'error', text: 'You are not logged in.' };
    }

    this.isResending = false;
  }
}
