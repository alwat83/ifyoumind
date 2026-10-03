import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { RegisterComponent } from './auth/register/register.component';
import { VerifyEmailComponent } from './auth/verify-email/verify-email.component';
import { LoginComponent } from './auth/login/login.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { TermsOfConductComponent } from './pages/terms-of-conduct/terms-of-conduct.component';

export const routes:Routes=[
  {
    path:'',
    loadComponent:()=>import('./intelligence/public-landing.component').then(m=>m.PublicLandingComponent),
  },
  {path:'register',component:RegisterComponent},
  {path:'login',component:LoginComponent},
  {path:'verify-email',component:VerifyEmailComponent},
  {
    path:'app',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/consumer-home.component').then(m=>m.ConsumerHomeComponent),
  },
  {
    path:'app/decide',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/decision-flow.component').then(m=>m.DecisionFlowComponent),
  },
  {
    path:'app/result/:projectId',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/market-report.component').then(m=>m.MarketReportComponent),
  },
  {
    path:'app/pricing',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/pricing.component').then(m=>m.PricingComponent),
  },
  {
    path:'app/data',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/data-import.component').then(m=>m.DataImportComponent),
  },
  {
    path:'app/ask',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/ask.component').then(m=>m.AskIntelligenceComponent),
  },
  {
    path:'app/advanced',
    canActivate:[authGuard],
    loadComponent:()=>import('./intelligence/data-canvas.component').then(m=>m.DataCanvasComponent),
  },
  {path:'privacy-policy',component:PrivacyPolicyComponent},
  {path:'terms-of-conduct',component:TermsOfConductComponent},
  {path:'**',redirectTo:''},
];