// src/app/features/employee-management/employee-management.routes.ts
import { Routes } from '@angular/router';
import { EmployeeListComponent } from './employee-list/employee-list.component';
import { EmployeeDetailComponent } from './employee-detail/employee-detail.component';
import { EmployeeFormComponent } from './employee-form/employee-form.component';

export const employeeRoutes: Routes = [
  {
    path: '',
    component: EmployeeListComponent
  },
  {
    path: 'new',
    component: EmployeeFormComponent
  },
  {
    path: ':id',
    component: EmployeeDetailComponent
  },
  {
    path: ':id/edit',
    component: EmployeeFormComponent
  }
];