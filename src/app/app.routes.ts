// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { STORE_ROUTES } from './features/store-management/store-management.routes';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users',
    loadComponent: () => import('./features/user-management/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users/new',
    loadComponent: () => import('./features/user-management/user-detail/user-detail.component').then(m => m.UserDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/user-management/user-detail/user-detail.component').then(m => m.UserDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'profile',
    loadComponent: () => import('./features/user-management/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'roles',
    loadComponent: () => import('./features/user-management/role-list/role-list.component').then(m => m.RoleListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'roles/new',
    loadComponent: () => import('./features/user-management/role-detail/role-detail.component').then(m => m.RoleDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'roles/:id',
    loadComponent: () => import('./features/user-management/role-detail/role-detail.component').then(m => m.RoleDetailComponent),
    canActivate: [AuthGuard]
  },
  // Store routes
  {
    path: 'stores',
    loadComponent: () => import('./features/store-management/store-list/store-list.component').then(m => m.StoreListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'stores/new',
    loadComponent: () => import('./features/store-management/store-form/store-form.component').then(m => m.StoreFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'stores/:id',
    loadComponent: () => import('./features/store-management/store-detail/store-detail.component').then(m => m.StoreDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'stores/:id/edit',
    loadComponent: () => import('./features/store-management/store-form/store-form.component').then(m => m.StoreFormComponent),
    canActivate: [AuthGuard]
  },
  // Employee routes (new)
  {
    path: 'employees',
    loadComponent: () => import('./features/employee-management/employee-list/employee-list.component').then(m => m.EmployeeListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'employees/new',
    loadComponent: () => import('./features/employee-management/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'employees/:id',
    loadComponent: () => import('./features/employee-management/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'employees/:id/edit',
    loadComponent: () => import('./features/employee-management/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];