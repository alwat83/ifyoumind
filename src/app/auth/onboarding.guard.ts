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
        // If no user is logged in, allow access to public pages
        // but redirect from protected routes to login.
        // This guard assumes it's placed on routes that require auth.
        return of(router.parseUrl('/')); // or to a login page
      }
      // User is logged in, check their onboarding status
      return userService.getUserProfile(user.uid).pipe(
        map(profile => {
          if (profile?.hasCompletedOnboarding) {
            // User has completed onboarding, allow access
            return true;
          } else {
            // User has not completed onboarding, redirect to the wizard
            return router.parseUrl('/onboarding');
          }
        })
      );
    })
  );
};
