// src/app/features/dashboard/widgets/payment-stats-widget/payment-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PaymentService } from '../../../../core/services/payment.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { PaymentStatus } from '../../../../shared/models/payment.model';

@Component({
  selector: 'app-payment-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <h3 class="text-lg font-medium mb-4">Payments Overview</h3>
        
        <div *ngIf="loading" class="flex justify-center py-4">
          <div class="w-6 h-6 border-2 border-t-2 border-primary-500 rounded-full animate-spin"></div>
        </div>
        
        <div *ngIf="!loading && isManager">
          <!-- Manager/Admin View -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p class="text-sm text-slate-500 dark:text-slate-400">Pending Payments</p>
              <p class="text-2xl font-semibold">{{ pendingCount }}</p>
              <a *ngIf="pendingCount > 0" routerLink="/payments" [queryParams]="{status: 'pending'}" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline">View payments</a>
            </div>
            
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p class="text-sm text-slate-500 dark:text-slate-400">Payments to Process</p>
              <p class="text-2xl font-semibold">{{ unprocessedCount }}</p>
              <a *ngIf="unprocessedCount > 0" routerLink="/payments" [queryParams]="{status: 'pending'}" class="text-sm text-green-600 hover:text-green-800 dark:text-green-400 hover:underline">Process now</a>
            </div>
            
            <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p class="text-sm text-slate-500 dark:text-slate-400">Disputed Payments</p>
              <p class="text-2xl font-semibold">{{ disputedCount }}</p>
              <a *ngIf="disputedCount > 0" routerLink="/payments" [queryParams]="{status: 'disputed'}" class="text-sm text-red-600 hover:text-red-800 dark:text-red-400 hover:underline">Resolve disputes</a>
            </div>
          </div>
          
          <div *ngIf="canGeneratePayments" class="flex justify-end">
            <a routerLink="/payments/generate" class="btn btn-primary btn-sm">
              Generate Payments
            </a>
          </div>
        </div>
        
        <div *ngIf="!loading && !isManager">
          <!-- Employee View -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p class="text-sm text-slate-500 dark:text-slate-400">Pending Confirmation</p>
              <p class="text-2xl font-semibold">{{ ownPendingCount }}</p>
              <a *ngIf="ownPendingCount > 0" routerLink="/payments/my-payments" [queryParams]="{status: 'paid'}" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 hover:underline">View payments</a>
            </div>
            
            <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <p class="text-sm text-slate-500 dark:text-slate-400">Confirmed Payments</p>
              <p class="text-2xl font-semibold">{{ ownConfirmedCount }}</p>
              <a routerLink="/payments/my-payments" class="text-sm text-green-600 hover:text-green-800 dark:text-green-400 hover:underline">View all payments</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PaymentStatsWidgetComponent implements OnInit {
  // UI state
  loading = true;
  
  // Stats for admin/manager view
  pendingCount = 0;
  unprocessedCount = 0;
  disputedCount = 0;
  
  // Stats for employee view
  ownPendingCount = 0;
  ownConfirmedCount = 0;
  
  // Permissions
  get isManager(): boolean {
    return this.permissionService.hasPermission('payments:write');
  }
  
  get canGeneratePayments(): boolean {
    return this.permissionService.hasPermission('payments:write');
  }
  
  constructor(
    private paymentService: PaymentService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    if (this.isManager) {
      this.loadManagerStats();
    } else {
      this.loadEmployeeStats();
    }
  }
  
  loadManagerStats(): void {
    // Load stats for managers
    // Get counts of different payment statuses
    
    // Get pending payments
    this.paymentService.getPayments({ status: PaymentStatus.PENDING, limit: 100 }).subscribe({
      next: (payments) => {
        this.pendingCount = payments.length;
        
        // Count unprocessed (ready to be paid)
        this.unprocessedCount = payments.filter(p => !p.payment_date).length;
        
        // Now get disputed payments
        this.paymentService.getPayments({ status: PaymentStatus.DISPUTED, limit: 100 }).subscribe({
          next: (disputed) => {
            this.disputedCount = disputed.length;
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      },
      error: () => {
        this.loading = false;
      }
    });
  }
  
  loadEmployeeStats(): void {
    // Load employee's own payments
    this.paymentService.getMyPayments({ limit: 100 }).subscribe({
      next: (payments) => {
        // Count awaiting confirmation
        this.ownPendingCount = payments.filter(p => p.status === PaymentStatus.PAID).length;
        
        // Count confirmed payments
        this.ownConfirmedCount = payments.filter(p => p.status === PaymentStatus.CONFIRMED).length;
        
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}