import { Routes } from '@angular/router';
import { IdeaSubmitComponent } from './idea-submit/idea-submit.component';
import { IdeaListComponent } from './idea-list/idea-list.component';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from './auth.guard';
import { AboutPageComponent } from './pages/about/about-page.component';
import { MissionPageComponent } from './pages/mission/mission-page.component';
import { FaqPageComponent } from './pages/faq/faq-page.component';

export const routes: Routes = [
  { path: '', component: IdeaListComponent },
  { path: 'idea/:id', loadComponent: () => import('./idea-detail/idea-detail.component').then(m => m.IdeaDetailComponent) },
  { path: 'submit', component: IdeaSubmitComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
  { path: 'about', component: AboutPageComponent },
  { path: 'mission', component: MissionPageComponent },
  { path: 'faq', component: FaqPageComponent },
];