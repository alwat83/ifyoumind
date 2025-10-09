import { Component, ElementRef, HostListener, QueryList, ViewChild, ViewChildren, inject } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Auth, signInWithPopup, GoogleAuthProvider, signOut, user, User } from '@angular/fire/auth';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
import { ToastComponent } from './components/toast/toast.component';
import { FabComponent } from './components/fab/fab.component';
import { IdeaWizardComponent } from './components/idea-wizard/idea-wizard.component';
import { ThemeService } from './services/theme.service';
import { TourService } from './services/tour.service';
import { UserService } from './services/user.service';
import { filter, switchMap, take } from 'rxjs';
import { ChecklistComponent } from './components/checklist/checklist.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, CommonModule, ToastComponent, FabComponent, IdeaWizardComponent, ChecklistComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ifyoumind';
  auth: Auth = inject(Auth);
  user$: Observable<User | null>;
  showIdeaWizard = false;
  themeService = inject(ThemeService);
  tourService = inject(TourService);
  userService = inject(UserService);
  aboutOpen = false;
  // Menu element refs for accessible navigation
  @ViewChild('aboutMenuPanel') aboutMenuPanel?: ElementRef<HTMLElement>;
  @ViewChild('aboutTrigger') aboutTrigger?: ElementRef<HTMLButtonElement>;
  @ViewChildren('aboutItem') aboutItems?: QueryList<ElementRef<HTMLAnchorElement>>;
  private aboutCloseHoverTimeout: any;

  constructor() {
    this.user$ = user(this.auth);
    this.checkAndStartTour();
  }

  private checkAndStartTour(): void {
    this.user$.pipe(
      filter(user => !!user), // Proceed only if the user is logged in
      switchMap(user => this.userService.getUserProfile(user!.uid)),
      filter(profile => !!profile && !profile.hasSeenPlatformTour), // Proceed only if we have a profile and the tour hasn't been seen
      take(1) // Ensure this subscription runs only once
    ).subscribe(() => {
      // Use a timeout to ensure the view is initialized before starting the tour
      setTimeout(() => this.tourService.startTour(), 500);
    });
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
    if (this.aboutOpen) {
      // Defer focus so DOM renders
      queueMicrotask(() => this.focusFirstItem());
    }
  }
  closeAboutMenu() { this.aboutOpen = false; }
  onKeyClose(e: KeyboardEvent) { if (e.key === 'Escape') this.closeAboutMenu(); }

  /* Outside click handling */
  @HostListener('document:click', ['$event'])
  onDocumentClick(ev: MouseEvent) {
    if (!this.aboutOpen) return;
    const target = ev.target as HTMLElement;
    if (this.isInsideMenu(target)) return;
    this.closeAboutMenu();
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKey(ev: KeyboardEvent) {
    if (ev.key === 'Escape' && this.aboutOpen) {
      this.closeAboutMenu();
      this.aboutTrigger?.nativeElement.focus();
    }
  }

  private isInsideMenu(el: HTMLElement): boolean {
    const menu = this.aboutMenuPanel?.nativeElement;
    const trigger = this.aboutTrigger?.nativeElement;
    return !!(menu && menu.contains(el)) || !!(trigger && trigger.contains(el));
  }

  onAboutTriggerClick(event: Event) {
    event.stopPropagation();
    this.toggleAboutMenu();
  }
  onAboutTriggerKey(event: any) {
    event.preventDefault();
    this.onAboutTriggerClick(event);
  }

  onAboutItemClick(event: Event) {
    // Use microtask to allow routerLink navigation before closing
    queueMicrotask(() => this.closeAboutMenu());
  }

  /* Focus helpers */
  focusFirstAboutItem(event?: Event) {
    event?.preventDefault();
    this.focusFirstItem();
  }
  focusLastAboutItem(event: Event) {
    event.preventDefault();
    const items = this.getItems();
    if (items.length) items[items.length - 1].focus();
  }
  focusNextAboutItem(event: any) {
    const items = this.getItems();
    if (!items.length) return;
    const active = document.activeElement as HTMLElement;
    const idx = items.indexOf(active);
    if (idx === -1) { this.focusFirstItem(); return; }
    event.preventDefault();
    const next = items[(idx + 1) % items.length];
    next.focus();
  }
  onAboutMenuTab(event: any) {
    // Close when tabbing out (let natural tab order proceed)
    // If shift+tab from first or tab from last -> close
    const items = this.getItems();
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement as HTMLElement;
    if ((event.shiftKey && active === first) || (!event.shiftKey && active === last)) {
      this.closeAboutMenu();
    }
  }
  private focusFirstItem() {
    const first = this.getItems()[0];
    if (first) first.focus();
  }
  private getItems(): HTMLElement[] {
    return (this.aboutItems?.toArray().map(r => r.nativeElement) || []).filter(Boolean);
  }
}