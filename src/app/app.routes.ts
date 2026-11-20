import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { LoginComponent } from './auth/login/login.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfConductComponent } from './pages/terms-of-conduct/terms-of-conduct.component';
import { LEGACY_CONSUMER_ROUTES } from './return-url';

// Redirect inside the existing app so bookmarks and provider callbacks retain their full context.
const legacyRedirects: Routes = LEGACY_CONSUMER_ROUTES.map(({ from, to }) => ({
  path: from,
  pathMatch: 'full',
  redirectTo: ({ params, queryParams, fragment }) => {
    const commands = ['/' + to];
    if (params['projectId']) commands.push(params['projectId']);
    return inject(Router).createUrlTree(commands, { queryParams, fragment: fragment ?? undefined });
  },
}));

export const routes:Routes=[
  {
    path:'',
    loadComponent:()=>import('./intelligence/public-landing.component').then(m=>m.PublicLandingComponent),
  },
  {
    path:'sample-report',
    data:{sample:true},
    loadComponent:()=>import('./intelligence/market-report.component').then(m=>m.MarketReportComponent),
  },
  {path:'register',component:RegisterComponent},
  {path:'login',component:LoginComponent},
  {path:'verify-email',component:VerifyEmailComponent},
  {
    path:'decisions',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/consumer-home.component').then(m=>m.ConsumerHomeComponent),
  },
  {
    path:'decide',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/decision-flow.component').then(m=>m.DecisionFlowComponent),
  },
  {
    path:'decisions/:projectId',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/market-report.component').then(m=>m.MarketReportComponent),
  },
  {
    path:'pricing',
    loadComponent:()=>import('./intelligence/pricing.component').then(m=>m.PricingComponent),
  },
  {
    path:'growth',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/growth-dashboard.component').then(m=>m.GrowthDashboardComponent),
  },
  {
    path:'account',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/account.component').then(m=>m.AccountComponent),
  },
  {
    path:'data',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/consumer-data.component').then(m=>m.ConsumerDataComponent),
  },
  {
    path:'ask',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/ask.component').then(m=>m.AskIntelligenceComponent),
  },
  {
    path:'advanced',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/data-canvas.component').then(m=>m.DataCanvasComponent),
  },
  {path:'privacy-policy',component:PrivacyPolicyComponent},
  {path:'terms-of-conduct',component:TermsOfConductComponent},
  ...legacyRedirects,
  {path:'**',redirectTo:''},
];
