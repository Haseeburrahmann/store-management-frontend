// src/app/features/user-management/user-management.routes.ts
import { Routes } from '@angular/router';
import { UserListComponent } from './user-list/user-list.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
import { UserFormComponent } from './user-form/user-form.component';
import { roleGuard } from '../../core/auth/guards/role.guard';
import { PermissionArea, PermissionAction, getPermissionString } from '../../shared/models/role.model';

export const USER_MANAGEMENT_ROUTES: Routes = [
  {
    path: '',
    component: UserListComponent,
    canActivate: [roleGuard],
    data: {
      permissions: [getPermissionString(PermissionArea.USERS, PermissionAction.READ)]
    }
  },
  {
    path: 'create',
    component: UserFormComponent,
    canActivate: [roleGuard],
    data: {
      permissions: [getPermissionString(PermissionArea.USERS, PermissionAction.WRITE)]
    }
  },
  {
    path: 'edit/:id',
    component: UserFormComponent,
    canActivate: [roleGuard],
    data: {
      permissions: [getPermissionString(PermissionArea.USERS, PermissionAction.WRITE)]
    }
  },
  {
    path: ':id',
    component: UserDetailComponent,
    canActivate: [roleGuard],
    data: {
      permissions: [getPermissionString(PermissionArea.USERS, PermissionAction.READ)]
    }
  }
];