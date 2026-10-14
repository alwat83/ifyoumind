import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { intentParams, readIntent } from '../../purchase-intent';
import { Router, RouterModule } from '@angular/router';
import { Auth, sendEmailVerification, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './verify-email.component.html',
  styleUrls: ['./verify-email.component.scss'],
})
export class VerifyEmailComponent {
  isResending = false;
  isChecking = false;
  message: { type: 'success' | 'error'; text: string } | null = null;

  private auth: Auth = inject(Auth);
  private router: Router = inject(Router);

  get email(): string {
    return this.auth.currentUser?.email || 'your email address';
  }

  /** Re-reads the account after the visitor clicks the link in another tab, then continues. */
  async continueIfVerified() {
    // After a page load Firebase restores the session asynchronously; wait for it so an
    // early click isn't treated as signed out.
    await this.auth.authStateReady();
    const user = this.auth.currentUser;
    if (!user) {
      await this.router.navigate(['/login']);
      return;
    }
    this.isChecking = true;
    this.message = null;
    try {
      await user.reload();
      if (this.auth.currentUser?.emailVerified) {
        await this.auth.currentUser.getIdToken(true);
        await this.router.navigate(['/app/decide'], { queryParams: intentParams({ type: 'business' }, readIntent()) });
        return;
      }
      this.message = { type: 'error', text: 'Not verified yet. Open the link in the email we sent, then try again.' };
    } catch {
      this.message = { type: 'error', text: 'We could not check right now. Please try again.' };
    } finally {
      this.isChecking = false;
    }
  }

  async resendVerificationEmail() {
    this.isResending = true;
    this.message = null;
    await this.auth.authStateReady();
    const user = this.auth.currentUser;
    if (user) {
      try {
        await sendEmailVerification(user);
        this.message = { type: 'success', text: `A new verification email has been sent to ${this.email}.` };
      } catch {
        this.message = { type: 'error', text: 'We could not send the email. Wait a minute and try again.' };
      }
    } else {
      this.message = { type: 'error', text: 'You are not signed in.' };
    }
    this.isResending = false;
  }

  async useDifferentEmail() {
    await signOut(this.auth);
    await this.router.navigate(['/register']);
  }
}
