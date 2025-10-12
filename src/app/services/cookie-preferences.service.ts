import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CookiePreferencesService {
  private isOpen = new BehaviorSubject<boolean>(false);
  public isOpen$ = this.isOpen.asObservable();

  open() {
    this.isOpen.next(true);
  }

  close() {
    this.isOpen.next(false);
  }
}
