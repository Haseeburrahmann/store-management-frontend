import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';
import { IdValidationGuard } from '../../core/auth/id-validation.guard';

export const SCHEDULE_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./schedule-list/schedule-list.component')
      .then(m => m.ScheduleListComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'new',
    loadComponent: () => import('./schedule-form/schedule-form.component')
      .then(m => m.ScheduleFormComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:write' }
  },
  {
    path: ':id',
    loadComponent: () => import('./schedule-detail/schedule-detail.component')
      .then(m => m.ScheduleDetailComponent),
    canActivate: [AuthGuard, IdValidationGuard],
    data: { 
      requiredPermission: 'hours:read',
      idParam: 'id',
      idType: 'schedule'
    }
  },
  {
    path: ':id/edit',
    loadComponent: () => import('./schedule-form/schedule-form.component')
      .then(m => m.ScheduleFormComponent),
    canActivate: [AuthGuard, IdValidationGuard],
    data: { 
      requiredPermission: 'hours:write',
      isEdit: true,
      idParam: 'id',
      idType: 'schedule'
    }
  }
];