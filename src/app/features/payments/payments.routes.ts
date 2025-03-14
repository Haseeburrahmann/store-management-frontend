// src/app/features/payments/payments.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from '../../core/auth/auth.guard';

export const PAYMENT_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./payment-list/payment-list.component').then(m => m.PaymentListComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'payments:read' }
  },
  {
    path: 'my-payments',
    loadComponent: () => import('./my-payments/my-payments.component').then(m => m.MyPaymentsComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'hours:read' }
  },
  {
    path: 'generate',
    loadComponent: () => import('./payment-generation/payment-generation.component').then(m => m.PaymentGenerationComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'payments:write' }
  },
  {
    path: ':id',
    loadComponent: () => import('./payment-detail/payment-detail.component').then(m => m.PaymentDetailComponent),
    canActivate: [AuthGuard],
    data: { requiredPermission: 'payments:read' }
  },
  {
    path: ':id/confirm',
    loadComponent: () => import('./payment-confirmation/payment-confirmation.component').then(m => m.PaymentConfirmationComponent),
    canActivate: [AuthGuard]
  }
];