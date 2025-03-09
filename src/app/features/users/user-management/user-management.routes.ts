// src/app/features/users/user-management/user-management.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../../core/auth/auth.guard';

export const USER_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./user-list/user-list.component').then(m => m.UserListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'users:read' }
  },
  {
    path: 'create',
    loadComponent: () => import('./user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'users:write' }
  },
  {
    path: ':id',
    loadComponent: () => import('./user-detail/user-detail.component').then(m => m.UserDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'users:read' }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./user-form/user-form.component').then(m => m.UserFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'users:write', isEdit: true }
  }
];