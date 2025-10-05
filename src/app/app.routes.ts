import { Routes } from '@angular/router';
import { IdeaSubmitComponent } from './idea-submit/idea-submit.component';
import { IdeaListComponent } from './idea-list/idea-list.component';
import { ProfileComponent } from './profile/profile.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  { path: '', component: IdeaListComponent },
  { path: 'idea/:id', loadComponent: () => import('./idea-detail/idea-detail.component').then(m => m.IdeaDetailComponent) },
  { path: 'submit', component: IdeaSubmitComponent, canActivate: [authGuard] },
  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },
];