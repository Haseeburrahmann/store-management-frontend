// // src/app/features/users/users.routes.ts
// import { Routes } from '@angular/router';
// import { AuthGuard } from '../../core/auth/auth.guard';

// export const USER_ROUTES: Routes = [
//   {
//     path: 'profile',
//     loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent)
//   },
//   {
//     path: 'management',
//     loadChildren: () => import('./user-management/user-management.routes').then(m => m.USER_MANAGEMENT_ROUTES),
//     canActivate: [AuthGuard],
//     data: { requiredPermission: 'users:read' }
//   }
// ];