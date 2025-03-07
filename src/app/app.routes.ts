// src/app/app.routes.ts

import { Routes } from '@angular/router';
import { AuthGuard } from './core/auth/guards/auth.guard';
import { STORE_ROUTES } from './features/store-management/store-management.routes';
import { employeeRoutes } from './features/employee-management/employee-management.routes';
import { HOURS_TRACKING_ROUTES } from './features/hours-tracking/hours-tracking.routes';

/**
 * Main application routes with standardized permissions
 */
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  
  // Auth routes (no guard)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  
  // Dashboard - accessible to all authenticated users
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard]
  },
  
  // User Management Routes with standardized permissions
  {
    path: 'users',
    loadComponent: () => import('./features/user-management/user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [AuthGuard],
    data: { permission: 'users:read' }
  },
  {
    path: 'users/new',
    loadComponent: () => import('./features/user-management/user-detail/user-detail.component').then(m => m.UserDetailComponent),
    canActivate: [AuthGuard],
    data: { permission: 'users:write' }
  },
  {
    path: 'users/:id',
    loadComponent: () => import('./features/user-management/user-detail/user-detail.component').then(m => m.UserDetailComponent),
    canActivate: [AuthGuard],
    data: { permission: 'users:read' }
  },
  
  // Profile - accessible to all authenticated users
  {
    path: 'profile',
    loadComponent: () => import('./features/user-management/user-profile/user-profile.component').then(m => m.UserProfileComponent),
    canActivate: [AuthGuard]
  },
  
  // Role Management Routes with standardized permissions
  {
    path: 'roles',
    loadComponent: () => import('./features/role-management/role-list/role-list.component').then(m => m.RoleListComponent),
    canActivate: [AuthGuard],
    data: { permission: 'roles:read' }
  },
  {
    path: 'roles/new',
    loadComponent: () => import('./features/role-management/role-detail/role-detail.component').then(m => m.RoleDetailComponent),
    canActivate: [AuthGuard],
    data: { permission: 'roles:write' }
  },
  {
    path: 'roles/:id',
    loadComponent: () => import('./features/role-management/role-detail/role-detail.component').then(m => m.RoleDetailComponent),
    canActivate: [AuthGuard],
    data: { permission: 'roles:read' }
  },
  
  // Store Management Routes (using imported routes with standardized permissions)
  {
    path: 'stores',
    children: STORE_ROUTES
  },
  
  // Employee Management Routes (using imported routes with standardized permissions)
  {
    path: 'employees',
    children: employeeRoutes
  },
  
  // Hours Tracking routes (now using imported routes with standardized permissions)
  ...HOURS_TRACKING_ROUTES,
  
  // Fallback route
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];