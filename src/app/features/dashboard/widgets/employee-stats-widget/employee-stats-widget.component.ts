// src/app/features/dashboard/widgets/employee-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmployeeService } from '../../../../core/services/employee.service';
import { PermissionService } from '../../../../core/auth/permission.service';

@Component({
  selector: 'app-employee-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-slate-100 dark:bg-slate-700 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Active Employees</dt>
              <dd class="flex items-baseline">
                <div *ngIf="!loading" class="text-2xl font-semibold text-slate-900 dark:text-white">{{ activeEmployeeCount }}</div>
                <div *ngIf="loading" class="text-2xl font-semibold text-slate-400 dark:text-slate-500">...</div>
                <div *ngIf="!loading && totalEmployees > 0" class="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-500">
                  <svg class="w-5 h-5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="sr-only">Increased by</span>
                  {{ percentageActive }}%
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
        <div class="text-sm">
          <a routerLink="/employees" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">View all employees</a>
        </div>
      </div>
    </div>
  `
})
export class EmployeeStatsWidgetComponent implements OnInit {
  activeEmployeeCount = 0;
  totalEmployees = 0;
  loading = true;
  percentageActive = 0;
  
  constructor(
    private employeeService: EmployeeService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Only load data if user has permission to view employees
    if (this.permissionService.hasPermission('employees:read')) {
      this.loadEmployeeStats();
    } else {
      this.loading = false;
    }
  }
  
  loadEmployeeStats(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.totalEmployees = employees.length;
        this.activeEmployeeCount = employees.filter(employee => employee.employment_status === 'active').length;
        
        // Calculate percentage of active employees
        if (this.totalEmployees > 0) {
          this.percentageActive = Math.round((this.activeEmployeeCount / this.totalEmployees) * 100);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading employee stats:', err);
        this.loading = false;
      }
    });
  }
}