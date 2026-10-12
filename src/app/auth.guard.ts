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
        // No emulator exception: local and CI runs verify email exactly as production does.
        if (state.url === '/profile') {
          return true;
        } else {
          router.navigate(['/verify-email']);
          return false;
        }
      } else {
        router.navigate(['/login'],{queryParams:loginParams(state.url)});
        return false;
      }
    }),
  );
};
