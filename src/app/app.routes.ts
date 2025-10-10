import { Routes } from '@angular/router';
import { IdeaSubmitComponent } from './idea-submit/idea-submit.component';
import { IdeaListComponent } from './idea-list/idea-list.component';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from './auth.guard';
import { onboardingGuard } from './auth/onboarding.guard';
import { OnboardingComponent } from './components/onboarding/onboarding.component';
import { RegisterComponent } from './auth/register/register.component';
import { AboutPageComponent } from './pages/about/about-page.component';
import { MissionPageComponent } from './pages/mission/mission-page.component';
import { FaqPageComponent } from './pages/faq/faq-page.component';
import { TagListComponent } from './pages/tag-list/tag-list.component';
import { NewbieIdeasComponent } from './newbie-ideas/newbie-ideas.component';

import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';

import { LoginComponent } from './auth/login/login.component';

export const routes: Routes = [
  { path: '', component: IdeaListComponent },
  { path: 'idea-list', component: IdeaListComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'login', component: LoginComponent },
  { path: 'verify-email', component: VerifyEmailComponent },
  { path: 'idea/:id', loadComponent: () => import('./idea-detail/idea-detail.component').then(m => m.IdeaDetailComponent) },
  { path: 'submit', component: IdeaSubmitComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutPageComponent },
  { path: 'mission', component: MissionPageComponent },
  { path: 'faq', component: FaqPageComponent },
  { path: 'tags', component: TagListComponent },
  { path: 't', redirectTo: '/tags', pathMatch: 'full' },
  { path: 'newbie-ideas', component: NewbieIdeasComponent },
];
