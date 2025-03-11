// src/app/features/schedules/schedules.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

export const SCHEDULE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./schedule-list/schedule-list.component').then(m => m.ScheduleListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    path: 'new',
    loadComponent: () => import('./schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:write' }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:write', isEdit: true }
  },
  {
    path: ':id',
    loadComponent: () => import('./schedule-detail/schedule-detail.component').then(m => m.ScheduleDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  }
];