// src/app/features/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { StoreStatsWidgetComponent } from './widgets/store-stats-widget/store-stats-widget.component';
import { EmployeeStatsWidgetComponent } from "./widgets/employee-stats-widget/employee-stats-widget.component";

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, StoreStatsWidgetComponent, EmployeeStatsWidgetComponent],
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
        
        <!-- Hours This Week -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-cyan-100 dark:bg-cyan-900 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Hours This Week</dt>
                  <dd class="flex items-baseline">
                    <div class="text-2xl font-semibold text-slate-900 dark:text-white">823</div>
                    <div class="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-500">
                      <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                      </svg>
                      <span class="sr-only">Increased by</span>
                      12%
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
            <div class="text-sm">
              <a routerLink="/hours" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">View timesheet</a>
            </div>
          </div>
        </div>
        
        <!-- Pending Approvals -->
        <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
          <div class="p-5">
            <div class="flex items-center">
              <div class="flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-md p-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div class="ml-5 w-0 flex-1">
                <dl>
                  <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Pending Approvals</dt>
                  <dd class="text-2xl font-semibold text-slate-900 dark:text-white">5</dd>
                </dl>
              </div>
            </div>
          </div>
          <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
            <div class="text-sm">
              <a routerLink="/approvals" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Review approvals</a>
            </div>
          </div>
        </div>
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