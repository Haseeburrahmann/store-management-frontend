// // src/app/features/hours-tracking/hours-tracking.routes.ts

// import { Routes } from '@angular/router';
// import { AuthGuard } from '../../core/auth/guards/auth.guard';
// import { HoursListComponent } from './hours-list/hours-list.component';
// import { HoursDetailComponent } from './hours-detail/hours-detail.component';
// import { HoursApprovalComponent } from './hours-approval/hours-approval.component';
// import { TimesheetComponent } from './timesheet/timesheet.component';
// import { ClockInOutComponent } from './clock-in-out/clock-in-out.component';

// /**
//  * Routes for the Hours Tracking feature with standardized permissions
//  * Ensuring all user roles can access their permitted functionality
//  */
// export const HOURS_TRACKING_ROUTES: Routes = [
//   // Main hours list - visible to all authenticated users with hours:read permission
//   {
//     path: 'hours',
//     canActivate: [AuthGuard],
//     children: [
//       { 
//         path: '', 
//         component: HoursListComponent,
//         data: { permission: 'hours:read' }
//       },
//       // Hour detail - accessible to anyone with hours:read
//       { 
//         path: ':id', 
//         component: HoursDetailComponent,
//         data: { permission: 'hours:read' }
//       }
//     ]
//   },
  
//   // Approval - only for managers/admins with approval permission
//   {
//     path: 'hours/approval', 
//     component: HoursApprovalComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'hours:approve' }
//   },
  
//   // Timesheet - accessible to all authenticated users to see their own timesheet
//   {
//     path: 'hours/timesheet/:employeeId', 
//     component: TimesheetComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'hours:read' }
//   },
  
//   // Clock in/out - accessible to all employees
//   {
//     path: 'hours/clock', 
//     component: ClockInOutComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'hours:write' }
//   },
  
//   // Hours approval by ID - only for managers/admins with approval permission
//   {
//     path: 'hours/approval/:id', 
//     component: HoursApprovalComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'hours:approve' }
//   }
// ];