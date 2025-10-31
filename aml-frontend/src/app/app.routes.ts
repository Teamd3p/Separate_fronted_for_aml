import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

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
    path: 'customer',
    loadComponent: () => import('./features/customer/layout/customer-layout').then(m => m.CustomerLayout),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/customer/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/customer/account/account').then(m => m.Account)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/customer/transactions/transactions').then(m => m.Transactions)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/customer/alerts/alerts').then(m => m.Alerts)
      },
      {
        path: 'kyc',
        loadComponent: () => import('./features/customer/kyc/kyc').then(m => m.Kyc)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/customer/profile/profile').then(m => m.Profile)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    redirectTo: '/customer/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin/dashboard',
    loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/kyc-review',
    loadComponent: () => import('./features/admin/kyc-review/kyc-review').then(m => m.KycReview),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN', 'COMPLIANCE_OFFICER'] }
  },
  {
    path: 'admin/users',
    loadComponent: () => import('./features/admin/users/users').then(m => m.Users),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/rules',
    loadComponent: () => import('./features/admin/rules/rules').then(m => m.Rules),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/audit',
    loadComponent: () => import('./features/admin/audit/audit').then(m => m.Audit),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/keywords',
    loadComponent: () => import('./features/admin/keywords/keywords').then(m => m.Keywords),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'admin/countries',
    loadComponent: () => import('./features/admin/country/country').then(m => m.Country),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] }
  },
  {
    path: 'compliance',
    loadComponent: () => import('./features/compliance/layout/compliance-layout').then(m => m.ComplianceLayout),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/compliance/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/compliance/alerts/alerts').then(m => m.Alerts)
      },
      {
        path: 'alerts/:id',
        loadComponent: () => import('./features/compliance/alerts/alerts').then(m => m.Alerts)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/compliance/transactions/transactions').then(m => m.Transactions)
      },
      {
        path: 'sar',
        loadComponent: () => import('./features/compliance/sar/sar').then(m => m.Sar)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/compliance/profile/profile').then(m => m.Profile)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
