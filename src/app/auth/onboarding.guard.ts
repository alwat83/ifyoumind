import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { UserService } from '../services/user.service';
import { map, switchMap, of, first } from 'rxjs';

export const onboardingGuard: CanActivateFn = (route, state) => {
  const auth: Auth = inject(Auth);
  const userService: UserService = inject(UserService);
  const router: Router = inject(Router);

  return user(auth).pipe(
    first(), // take the first emission and complete
    switchMap(user => {
      if (!user) {
        return of(true); // Allow access for non-logged-in users
      }
      // User is logged in, check their onboarding status
      return userService.getUserProfile(user.uid).pipe(
        map(profile => {
          if (profile?.hasCompletedOnboarding) {
            return true; // User has completed onboarding, allow access
          } else {
            // User has not completed onboarding, redirect to the wizard
            if (state.url === '/onboarding') {
              return true;
            }
            return router.parseUrl('/onboarding');
          }
        })
      );
    })
  );
};
