// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { PermissionService } from '../../core/auth/permission.service';
import { StoreStatsWidgetComponent } from './widgets/store-stats-widget/store-stats-widget.component';
import { EmployeeStatsWidgetComponent } from "./widgets/employee-stats-widget/employee-stats-widget.component";
import { TimesheetStatsWidgetComponent } from "./widgets/timesheet-stats-widget/timesheet-stats-widget.component";
import { ScheduleStatsWidgetComponent } from "./widgets/schedule-stats-widget/schedule-stats-widget.component";
import { PendingApprovalsWidgetComponent } from "./widgets/pending-approvals-widget/pending-approvals-widget.component";
import { AdminStatsWidgetComponent } from "./widgets/admin-stats-widget/admin-stats-widget.component";
import { RecentActivityWidgetComponent } from "./widgets/recent-activity-widget/recent-activity-widget.component";
import { SalesStatsWidgetComponent } from "./widgets/sales-stats-widget/sales-stats-widget.component";
import { PaymentStatsWidgetComponent } from "./widgets/payment-stats-widget/payment-stats-widget.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, 
    RouterLink, 
    StoreStatsWidgetComponent, 
    EmployeeStatsWidgetComponent, 
    TimesheetStatsWidgetComponent,
    ScheduleStatsWidgetComponent,
    PendingApprovalsWidgetComponent,
    AdminStatsWidgetComponent,
    RecentActivityWidgetComponent,
    SalesStatsWidgetComponent,
    PaymentStatsWidgetComponent
  ],
  template: `
    <div class="container mx-auto">
      <!-- Welcome section -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, {{ displayName }}!</h1>
        <p class="text-slate-600 dark:text-slate-300 mt-1">{{ welcomeMessage }}</p>
      </div>
      
      <!-- Admin Dashboard View -->
      <ng-container *ngIf="isAdmin || isManager">
        <!-- Admin Stats cards -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <!-- Admin Overview -->
          <app-admin-stats-widget class="lg:col-span-2"></app-admin-stats-widget>
          
          <!-- Active Stores -->
          <app-store-stats-widget></app-store-stats-widget>
          
          <!-- Active Employees -->
          <app-employee-stats-widget></app-employee-stats-widget>
        </div>
        
        <!-- Key Performance Indicators & Approvals -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <!-- Pending Approvals -->
          <app-pending-approvals-widget></app-pending-approvals-widget>
          
          <!-- Payment Widget -->
          <app-payment-stats-widget></app-payment-stats-widget>
        </div>
        
        <!-- Sales Overview -->
        <app-sales-stats-widget class="mb-6"></app-sales-stats-widget>
      </ng-container>
      
      <!-- Employee Dashboard View -->
      <ng-container *ngIf="!isAdmin && !isManager">
        <!-- Stats cards for employees -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          <!-- Timesheet Status -->
          <app-timesheet-stats-widget></app-timesheet-stats-widget>
          
          <!-- Schedule Status -->
          <app-schedule-stats-widget></app-schedule-stats-widget>
          
          <!-- Payment Status -->
          <app-payment-stats-widget></app-payment-stats-widget>
        </div>
        
        <!-- Task overview and pending items -->
        <div class="grid grid-cols-1 gap-6 mb-6">
          <!-- Pending Approvals or Tasks -->
          <app-pending-approvals-widget></app-pending-approvals-widget>
        </div>
      </ng-container>
      
      <!-- Recent Activity - Visible to All -->
      <app-recent-activity-widget></app-recent-activity-widget>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  isAdmin = false;
  isManager = false;
  
  get displayName(): string {
    const user = this.authService.currentUser;
    return user?.full_name || 'User';
  }
  
  get welcomeMessage(): string {
    if (this.isAdmin) {
      return "Here's what's happening across all stores today.";
    } else if (this.isManager) {
      return "Here's what's happening in your stores today.";
    } else {
      return "Here's your overview for today.";
    }
  }
  
  constructor(
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Determine user role
    this.isAdmin = this.permissionService.isAdmin();
    this.isManager = this.permissionService.isManager();
  }
}