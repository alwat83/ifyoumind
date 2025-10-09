import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth, createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from '@angular/fire/auth';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
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
      const userCredential = await createUserWithEmailAndPassword(this.auth, this.email, this.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: this.displayName });

      await this.userService.createUserProfile(user.uid, {
        displayName: this.displayName,
        username: this.username,
        email: this.email,
        hasCompletedOnboarding: false,
      });

      await sendEmailVerification(user);

      this.router.navigate(['/onboarding']);
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }
}