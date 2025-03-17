// src/app/features/inventory/inventory.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';
import { IdValidationGuard } from '../../core/auth/id-validation.guard';

export const INVENTORY_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./inventory-request-list/inventory-request-list.component').then(m => m.InventoryRequestListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'stock-requests:read' }
  },
  {
    path: 'create',
    loadComponent: () => import('./inventory-request-create/inventory-request-create.component').then(m => m.InventoryRequestCreateComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'stock-requests:write' }
  },
  {
    path: ':id',
    loadComponent: () => import('./inventory-request-detail/inventory-request-detail.component').then(m => m.InventoryRequestDetailComponent),
    canActivate: [AuthGuard, IdValidationGuard],
    data: { 
      requiredPermission: 'stock-requests:read',
      idParam: 'id',
      idType: 'inventory-request'
    }
  }
];