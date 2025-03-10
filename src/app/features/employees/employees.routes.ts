// src/app/features/employees/employees.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

export const EMPLOYEE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./employee-management/employee-list/employee-list.component').then(m => m.EmployeeListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'employees:read' }
  },
  {
    path: 'create',
    loadComponent: () => import('./employee-management/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'employees:write' }
  },
  {
    path: ':id',
    loadComponent: () => import('./employee-management/employee-detail/employee-detail.component').then(m => m.EmployeeDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'employees:read' }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./employee-management/employee-form/employee-form.component').then(m => m.EmployeeFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'employees:write', isEdit: true }
  }
];