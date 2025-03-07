// src/app/features/hours-tracking/hours-tracking.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/guards/auth.guard';
import { HoursListComponent } from './hours-list/hours-list.component';
import { HoursDetailComponent } from './hours-detail/hours-detail.component';
import { HoursApprovalComponent } from './hours-approval/hours-approval.component';
import { TimesheetComponent } from './timesheet/timesheet.component';
import { ClockInOutComponent } from './clock-in-out/clock-in-out.component';

export const HOURS_TRACKING_ROUTES: Routes = [
  {
    path: 'hours',
    canActivate: [AuthGuard],
    children: [
      { 
        path: '', 
        component: HoursListComponent,
        data: { permission: 'hours:read' }
      },
      { 
        path: 'approval', 
        component: HoursApprovalComponent,
        data: { permission: 'hours:approve' }
      },
      { 
        path: 'timesheet/:employeeId', 
        component: TimesheetComponent,
        data: { permission: 'hours:read' }
      },
      { 
        path: 'clock', 
        component: ClockInOutComponent,
        data: { permission: 'hours:write' }
      },
      { 
        path: ':id', 
        component: HoursDetailComponent,
        data: { permission: 'hours:read' }
      }
    ]
  }
];