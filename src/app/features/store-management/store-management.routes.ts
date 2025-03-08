// // src/app/features/store-management/store-management.routes.ts
// import { Routes } from '@angular/router';
// import { StoreListComponent } from './store-list/store-list.component';
// import { StoreFormComponent } from './store-form/store-form.component';
// import { StoreDetailComponent } from './store-detail/store-detail.component';
// import { AuthGuard } from '../../core/auth/guards/auth.guard';

// export const STORE_ROUTES: Routes = [
//   {
//     path: '',
//     component: StoreListComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'stores:read' }
//   },
//   {
//     path: 'new',
//     component: StoreFormComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'stores:write' }
//   },
//   {
//     path: ':id',
//     component: StoreDetailComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'stores:read' }
//   },
//   {
//     path: ':id/edit',
//     component: StoreFormComponent,
//     canActivate: [AuthGuard],
//     data: { permission: 'stores:write' }
//   }
// ];