import { Injectable, inject } from '@angular/core';
import { JoyrideService } from 'ngx-joyride';
import { UserService } from './user.service';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class TourService {
  private auth: Auth = inject(Auth);

  constructor(
    private readonly joyrideService: JoyrideService,
    private userService: UserService
    ) { }

  startTour(): void {
    this.joyrideService.startTour({
      steps: [
        'step1@app-root',
        'step2@app-root',
        'step3@app-root',
        'step4@app-root'
      ],
      themeColor: '#3b82f6',
      stepDefaultPosition: 'bottom',
    }).subscribe(() => {
      const user = this.auth.currentUser;
      if (user) {
        this.userService.saveUserProfile(user.uid, { hasSeenPlatformTour: true });
      }
    });
  }
}
