import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user, User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastComponent } from './components/toast/toast.component';
import { FabComponent } from './components/fab/fab.component';
import { IdeaWizardComponent } from './components/idea-wizard/idea-wizard.component';
import { ThemeService } from './services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, ToastComponent, FabComponent, IdeaWizardComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ifyoumind';
  auth: Auth = inject(Auth);
  user$: Observable<User | null>;
  showIdeaWizard = false;
  themeService = inject(ThemeService);
  aboutOpen = false;

  constructor() {
    this.user$ = user(this.auth);
  }

  login() {
    signInWithPopup(this.auth, new GoogleAuthProvider());
  }

  logout() {
    signOut(this.auth);
  }

  getUserInitial(user: User): string {
    return user.displayName?.charAt(0)?.toUpperCase() || 'U';
  }

  onQuickSubmit() {
    this.showIdeaWizard = true;
  }

  onIdeaSubmitted() {
    this.showIdeaWizard = false;
  }

  onWizardClosed() {
    this.showIdeaWizard = false;
  }

  toggleTheme() { this.themeService.toggle(); }

  toggleAboutMenu() {
    this.aboutOpen = !this.aboutOpen;
  }
  closeAboutMenu() { this.aboutOpen = false; }
  onKeyClose(e: KeyboardEvent) { if (e.key === 'Escape') this.closeAboutMenu(); }
}