import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { user } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { useLocalEmulators } from './firebase.config';
import { switchMap } from 'rxjs/operators';
import { ensureFreshVerification } from './auth/email-verification';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    switchMap(async (user) => {
      if (user) {
        if (await ensureFreshVerification(user)) return true;
        if (useLocalEmulators || state.url === '/profile') {
          return true;
        } else {
          router.navigate(['/verify-email']);
          return false;
        }
      } else {
        router.navigate(['/login']);
        return false;
      }
    }),
  );
};
