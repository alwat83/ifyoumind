import { Routes } from '@angular/router';
import { IdeaSubmitComponent } from './idea-submit/idea-submit.component';
import { IdeaListComponent } from './idea-list/idea-list.component';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from './auth.guard';
import { onboardingGuard } from './auth/onboarding.guard';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { AboutPageComponent } from './pages/about/about-page.component';
import { MissionPageComponent } from './pages/mission/mission-page.component';
import { FaqPageComponent } from './pages/faq/faq-page.component';

export const routes: Routes = [
  { path: '', component: IdeaListComponent, canActivate: [onboardingGuard] },
  { path: 'onboarding', component: OnboardingComponent, canActivate: [authGuard] },
  { path: 'idea/:id', loadComponent: () => import('./idea-detail/idea-detail.component').then(m => m.IdeaDetailComponent) },
  { path: 'submit', component: IdeaSubmitComponent, canActivate: [authGuard, onboardingGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard, onboardingGuard] },
  { path: 'about', component: AboutPageComponent },
  { path: 'mission', component: MissionPageComponent },
  { path: 'faq', component: FaqPageComponent },
];
