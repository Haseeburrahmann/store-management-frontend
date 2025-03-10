// src/app/features/stores/stores.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

export const STORE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./store-management/store-list/store-list.component').then(m => m.StoreListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'stores:read' }
  },
  {
    path: 'create',
    loadComponent: () => import('./store-management/store-form/store-form.component').then(m => m.StoreFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'stores:write' }
  },
  {
    path: ':id',
    loadComponent: () => import('./store-management/store-detail/store-detail.component').then(m => m.StoreDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'stores:read' }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./store-management/store-form/store-form.component').then(m => m.StoreFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'stores:write', isEdit: true }
  }
];