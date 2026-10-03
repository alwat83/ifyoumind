import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { LoginComponent } from './auth/login/login.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfConductComponent } from './pages/terms-of-conduct/terms-of-conduct.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./intelligence/public-landing.component').then((m) => m.PublicLandingComponent),
  },
  { path:'register', component:RegisterComponent },
  { path:'login', component:LoginComponent },
  { path:'verify-email', component:VerifyEmailComponent },
  {
    path:'app/pricing',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/pricing.component').then((m)=>m.PricingComponent),
  },
  {
    path:'app/market',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/market-intelligence.component').then((m)=>m.MarketIntelligenceComponent),
  },
  {
    path:'app/import',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/data-import.component').then((m)=>m.DataImportComponent),
  },
  {
    path:'app/canvas',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/data-canvas.component').then((m)=>m.DataCanvasComponent),
  },
  {
    path:'app/ask',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/ask.component').then((m)=>m.AskIntelligenceComponent),
  },
  {
    path:'app/insights',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/insight-feed.component').then((m)=>m.InsightFeedComponent),
  },
  {
    path:'app/connections',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/connections.component').then((m)=>m.IntelligenceConnectionsComponent),
  },
  {
    path:'app',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/dashboard.component').then((m)=>m.IntelligenceDashboardComponent),
  },
  { path:'privacy-policy', component:PrivacyPolicyComponent },
  { path:'terms-of-conduct', component:TermsOfConductComponent },
  { path:'**', redirectTo:'' },
];
