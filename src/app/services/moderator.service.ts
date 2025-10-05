import { Injectable, inject } from '@angular/core';
import { Functions, httpsCallable } from '@angular/fire/functions';
import { firstValueFrom } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ModeratorService {
  private functions = inject(Functions);

  setModerator(uid: string, value: boolean) {
    return httpsCallable(this.functions, 'setModerator')({ uid, value });
  }

  setAdmin(uid: string, value: boolean) {
    return httpsCallable(this.functions, 'setAdmin')({ uid, value });
  }

  async moderateDeleteIdea(ideaId: string): Promise<void> {
    await firstValueFrom(httpsCallable(this.functions, 'moderateDeleteIdea')({ ideaId }));
  }
}


