import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { user } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { switchMap } from 'rxjs/operators';
import { ensureFreshVerification } from './auth/email-verification';
import { loginParams } from './return-url';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    switchMap(async (user) => {
      if (user) {
        if (await ensureFreshVerification(user)) return true;
        // No exceptions: every guarded page needs a verified email, locally and in production.
        router.navigate(['/verify-email']);
        return false;
      } else {
        router.navigate(['/login'],{queryParams:loginParams(state.url)});
        return false;
      }
    }),
  );
};
