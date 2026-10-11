import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { user } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { useLocalEmulators } from './firebase.config';
import { switchMap } from 'rxjs/operators';
import { needsTokenRefresh } from './auth/email-verification';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    switchMap(async (user) => {
      if (user) {
        if (user.emailVerified) {
          // A just-verified account may still hold a token minted before verification;
          // refresh it once so email-verified Cloud Functions accept the next call.
          try {
            const token = await user.getIdTokenResult();
            if (needsTokenRefresh(user.emailVerified, token.claims['email_verified'])) {
              await user.getIdToken(true);
            }
          } catch {
            // Offline or token service unavailable: let navigation proceed; the backend still checks.
          }
          return true;
        }
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
