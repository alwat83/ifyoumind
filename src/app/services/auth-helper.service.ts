import { Injectable, inject } from '@angular/core';
import { Auth, user, User } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthHelperService {
  private auth: Auth = inject(Auth);

  /**
   * Resolve the currently signed-in user once (or null) without leaving dangling subscriptions.
   */
  getCurrentUserOnce(): Promise<User | null> {
    return firstValueFrom(user(this.auth));
  }
}
