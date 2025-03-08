// // src/app/features/employee-management/employee-management.routes.ts
// import { Routes } from '@angular/router';
// import { EmployeeListComponent } from './employee-list/employee-list.component';
// import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
// import { EmployeeFormComponent } from './employee-form/employee-form.component';
// import { AuthGuard } from '../../core/auth/guards/auth.guard';

// export const employeeRoutes: Routes = [
//   {
//     path: '',
//     component: EmployeeListComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'employees:read' }
//   },
//   {
//     path: 'new',
//     component: EmployeeFormComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'employees:write' }
//   },
//   {
//     path: ':id',
//     component: EmployeeDetailComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'employees:read' }
//   },
//   {
//     path: ':id/edit',
//     component: EmployeeFormComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'employees:write' }
//   }
// ];