// src/app/features/dashboard/widgets/admin-stats-widget/admin-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { StoreService } from '../../../../core/services/store.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { HoursService } from '../../../../core/services/hours.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-admin-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <h3 class="text-lg font-medium mb-4">System Overview</h3>
        
        <div *ngIf="loading" class="flex justify-center py-4">
          <div class="w-6 h-6 border-2 border-t-2 border-primary-500 rounded-full animate-spin"></div>
        </div>
        
        <div *ngIf="!loading" class="grid grid-cols-2 gap-4">
          <!-- Total Stores -->
          <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div class="flex items-center">
              <div class="p-3 bg-amber-100 dark:bg-amber-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">Total Stores</p>
                <p class="text-2xl font-semibold">{{ totalStores }}</p>
              </div>
            </div>
          </div>
          
          <!-- Total Employees -->
          <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div class="flex items-center">
              <div class="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-blue-600 dark:text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">Total Employees</p>
                <p class="text-2xl font-semibold">{{ totalEmployees }}</p>
              </div>
            </div>
          </div>
          
          <!-- Pending Timesheets -->
          <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div class="flex items-center">
              <div class="p-3 bg-purple-100 dark:bg-purple-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-600 dark:text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">Pending Approvals</p>
                <p class="text-2xl font-semibold">{{ pendingTimesheets }}</p>
                <a *ngIf="pendingTimesheets > 0" routerLink="/timesheets/approval" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline">
                  Review now
                </a>
              </div>
            </div>
          </div>
          
          <!-- Active Schedules -->
          <div class="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div class="flex items-center">
              <div class="p-3 bg-emerald-100 dark:bg-emerald-900 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-emerald-600 dark:text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div class="ml-4">
                <p class="text-sm text-slate-500 dark:text-slate-400">Active Schedules</p>
                <p class="text-2xl font-semibold">{{ activeSchedules }}</p>
                <a routerLink="/schedules" class="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline">
                  View all
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminStatsWidgetComponent implements OnInit {
  loading = true;
  totalStores = 0;
  totalEmployees = 0;
  pendingTimesheets = 0;
  activeSchedules = 0;
  
  constructor(
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private hoursService: HoursService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Load all stats in parallel for efficiency
    this.loadAdminStats();
  }
  
  loadAdminStats(): void {
    forkJoin({
      stores: this.storeService.getStores().pipe(catchError(() => of([]))),
      employees: this.employeeService.getEmployees().pipe(catchError(() => of([]))),
      timesheets: this.hoursService.getTimesheets({ status: 'submitted' }).pipe(catchError(() => of([]))),
      schedules: this.hoursService.getSchedules().pipe(catchError(() => of([])))
    }).subscribe({
      next: (results) => {
        this.totalStores = results.stores.length;
        this.totalEmployees = results.employees.length;
        this.pendingTimesheets = results.timesheets.length;
        
        // Calculate active schedules (for current week)
        const today = new Date();
        this.activeSchedules = results.schedules.filter(schedule => {
          const startDate = new Date(schedule.week_start_date);
          const endDate = new Date(schedule.week_end_date);
          return startDate <= today && today <= endDate;
        }).length;
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading admin stats:', err);
        this.loading = false;
      }
    });
  }
}