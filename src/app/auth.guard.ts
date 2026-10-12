import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { user } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';
import { loginParams } from './return-url';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    map((user) => {
      if (user) {
        // No emulator exception: local and CI runs verify email exactly as production does.
        if (user.emailVerified || state.url === '/profile') {
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
