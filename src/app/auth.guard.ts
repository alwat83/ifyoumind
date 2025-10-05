import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { user } from '@angular/fire/auth';
import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs/operators';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    map(user => {
      if (user) {
        return true;
      } else {
        router.navigate(['/']);
        return false;
      }
    })
  );
};