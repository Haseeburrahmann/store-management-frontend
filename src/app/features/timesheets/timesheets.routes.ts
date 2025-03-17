// src/app/features/timesheets/timesheets.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

export const TIMESHEET_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./timesheet-list/timesheet-list.component').then(m => m.TimesheetListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    path: 'current',
    loadComponent: () => import('./timesheet-detail/timesheet-detail.component').then(m => m.TimesheetDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read', isCurrent: true }
  },
  {
    path: 'approval',
    loadComponent: () => import('./timesheet-approval/timesheet-approval.component').then(m => m.TimesheetApprovalComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:approve' }
  },
  {
    path: 'create-past',
    loadComponent: () => import('./past-timesheet-form/past-timesheet-form.component').then(m => m.PastTimesheetFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:write' }
  },
  {
    path: ':id',
    loadComponent: () => import('./timesheet-detail/timesheet-detail.component').then(m => m.TimesheetDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  }
];