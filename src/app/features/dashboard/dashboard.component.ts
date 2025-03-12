// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { StoreStatsWidgetComponent } from './widgets/store-stats-widget/store-stats-widget.component';
import { EmployeeStatsWidgetComponent } from "./widgets/employee-stats-widget/employee-stats-widget.component";
import { TimesheetStatsWidgetComponent } from "./widgets/timesheet-stats-widget/timesheet-stats-widget.component";
import { ScheduleStatsWidgetComponent } from "./widgets/schedule-stats-widget/schedule-stats-widget.component";
import { PendingApprovalsWidgetComponent } from "./widgets/pending-approvals-widget/pending-approvals-widget.component";

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
    PendingApprovalsWidgetComponent
  ],
  template: `
    <div class="container mx-auto">
      <!-- Welcome section -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6 mb-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Welcome back, Admin!</h1>
        <p class="text-slate-600 dark:text-slate-300 mt-1">Here's what's happening in your stores today.</p>
      </div>
      
      <!-- Stats cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <!-- Active Employees -->
        <app-employee-stats-widget></app-employee-stats-widget>
        
        <!-- Active Stores -->
        <app-store-stats-widget></app-store-stats-widget>
        
        <!-- Timesheet Status -->
        <app-timesheet-stats-widget></app-timesheet-stats-widget>
        
        <!-- Schedule Status -->
        <app-schedule-stats-widget></app-schedule-stats-widget>
        
        <!-- Pending Approvals -->
        <app-pending-approvals-widget class="lg:col-span-4"></app-pending-approvals-widget>
      </div>
      
      <!-- Recent Activity -->
      <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden mb-6">
        <div class="px-6 py-5 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-medium leading-6 text-slate-900 dark:text-white">Recent Activity</h3>
        </div>
        <ul class="divide-y divide-slate-200 dark:divide-slate-700">
          <!-- Activity Item 1 -->
          <li>
            <div class="px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                    Jane Smith clocked in
                  </p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Today at 8:03 AM • Downtown Store
                  </p>
                </div>
                <div>
                  <div class="ml-4 flex-shrink-0 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1">
                    On time
                  </div>
                </div>
              </div>
            </div>
          </li>
          
          <!-- Activity Item 2 -->
          <li>
            <div class="px-6 py-4">
              <div class="flex items-center justify-between">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                    John Doe submitted timesheet for approval
                  </p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Yesterday at 5:15 PM • Total hours: 8.5
                  </p>
                </div>
                <div>
                  <div class="ml-4 flex-shrink-0 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-1">
                    Pending
                  </div>
                </div>
              </div>
            </div>
          </li>
          
          <!-- Activity Item 3 -->
          <li>
            <div class="px-6 py-4">
              <div class="flex items-center">
                <div class="min-w-0 flex-1">
                  <p class="text-sm font-medium text-slate-900 dark:text-white truncate">
                    Robert Johnson was assigned to Eastside Store
                  </p>
                  <p class="text-sm text-slate-500 dark:text-slate-400">
                    Mar 6, 2025 at 2:23 PM
                  </p>
                </div>
              </div>
            </div>
          </li>
        </ul>
        <div class="bg-slate-50 dark:bg-slate-700 px-6 py-3">
          <div class="text-sm">
            <a routerLink="/activity" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">View all activity</a>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  constructor(private authService: AuthService) {}
  
  ngOnInit(): void {
    // Load dashboard data
  }
}