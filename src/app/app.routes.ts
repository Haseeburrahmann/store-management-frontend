// src/app/app.routes.ts
import { Routes } from '@angular/router';
import { AuthLayoutComponent } from './layouts/auth-layout/auth-layout.component';
import { MainLayoutComponent } from './layouts/main-layout/main-layout.component';
import { AuthGuard } from './core/auth/auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthLayoutComponent,
    children: [
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
      },
      {
        path: 'register',
        loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
      },
      {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [AuthGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/users/profile/profile.component').then(m => m.ProfileComponent)
      },
      {
        path: 'users',
        loadChildren: () => import('./features/users/users.routes').then(m => m.USER_ROUTES),
      },
      {
        path: 'stores',
        loadChildren: () => import('./features/stores/stores.routes').then(m => m.STORE_ROUTES),
        canActivate: [AuthGuard],
        data: { requiredPermission: 'stores:read' }
      },
      {
        path: 'auth-test',
        loadComponent: () => import('./shared/components/auth-test/auth-test.component').then(m => m.AuthTestComponent)
      },
      {
        path: 'access-denied',
        loadComponent: () => import('./features/auth/access-denied/access-denied.component').then(m => m.AccessDeniedComponent)
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
    redirectTo: 'dashboard'
  }
];