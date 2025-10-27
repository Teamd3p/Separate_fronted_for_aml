import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(m => m.VerifyOtp)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/customer/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/kyc-review',
    loadComponent: () => import('./features/admin/kyc-review/kyc-review').then(m => m.KycReview),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/users/users').then(m => m.Users),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/rules',
    loadComponent: () => import('./features/admin/rules/rules').then(m => m.Rules),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/audit',
    loadComponent: () => import('./features/admin/audit/audit').then(m => m.Audit),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/keywords',
    loadComponent: () => import('./features/admin/keywords/keywords').then(m => m.Keywords),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/countries',
    loadComponent: () => import('./features/admin/country/country').then(m => m.Country),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
