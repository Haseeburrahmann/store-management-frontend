// src/app/features/hours/hours.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

export const HOURS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./hours-dashboard/hours-dashboard.component').then(m => m.HoursDashboardComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    // Time clock for employees to clock in/out
    path: 'time-clock',
    loadComponent: () => import('./time-clock/time-clock.component').then(m => m.TimeClockComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:write' }
  },
  {
    // Employee's view of their own timesheets
    path: 'my-timesheets',
    loadComponent: () => import('./timesheets/my-timesheets/my-timesheets.component').then(m => m.MyTimesheetsComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    // Detailed view of a specific timesheet
    path: 'timesheets/:id',
    loadComponent: () => import('./timesheets/timesheet-detail/timesheet-detail.component').then(m => m.TimesheetDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    // Manager's view of all timesheets
    path: 'all-timesheets',
    loadComponent: () => import('./timesheets/all-timesheets/all-timesheets.component').then(m => m.AllTimesheetsComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:approve' }
  },
  {
    // Schedule management
    path: 'schedules',
    loadComponent: () => import('./schedules/schedule-list/schedule-list.component').then(m => m.ScheduleListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    // Create a new schedule
    path: 'schedules/create',
    loadComponent: () => import('./schedules/schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:write' }
  },
  {
    // Detailed view of a specific schedule
    path: 'schedules/:id',
    loadComponent: () => import('./schedules/schedule-detail/schedule-detail.component').then(m => m.ScheduleDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    // Edit a schedule
    path: 'schedules/:id/edit',
    loadComponent: () => import('./schedules/schedule-form/schedule-form.component').then(m => m.ScheduleFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:write', isEdit: true }
  }
];