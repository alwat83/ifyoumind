import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Auth, user } from '@angular/fire/auth';
import { UserService } from '../../services/user.service';
import { switchMap } from 'rxjs';

@Component({
  selector: 'app-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './onboarding.component.html',
  styleUrls: ['./onboarding.component.scss']
})
export class OnboardingComponent implements OnInit {
  private auth: Auth = inject(Auth);
  private userService: UserService = inject(UserService);
  private router: Router = inject(Router);

  currentStep = 1;
  interests = [
    { name: 'Technology', value: 'tech', selected: false },
    { name: 'Health & Wellness', value: 'health', selected: false },
    { name: 'Sustainability & Environment', value: 'sustainability', selected: false },
    { name: 'Business & Finance', value: 'business', selected: false },
    { name: 'Social Impact', value: 'social', selected: false },
    { name: 'Education', value: 'education', selected: false },
  ];
  user$ = user(this.auth);

  ngOnInit(): void {
    // Prefill interests if they already exist on the user's profile
    this.user$.pipe(
      switchMap(user => {
        if (!user) return [];
        return this.userService.getUserProfile(user.uid);
      })
    ).subscribe(profile => {
      if (profile?.interests) {
        this.interests.forEach(i => {
          if (profile.interests?.includes(i.value)) {
            i.selected = true;
          }
        });
      }
    });
  }

  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  async finishOnboarding() {
    const selectedInterests = this.interests
      .filter(i => i.selected)
      .map(i => i.value);

    this.user$.pipe(
      switchMap(user => {
        if (!user) throw new Error('User not logged in');
        return this.userService.saveUserProfile(user.uid, {
          interests: selectedInterests,
          hasCompletedOnboarding: true
        });
      })
    ).subscribe({
      next: () => {
        this.router.navigate(['/']); // Redirect to the main feed
      },
      error: (err) => {
        console.error('Failed to save onboarding data', err);
        // Optionally show a toast message to the user
      }
    });
  }
}
