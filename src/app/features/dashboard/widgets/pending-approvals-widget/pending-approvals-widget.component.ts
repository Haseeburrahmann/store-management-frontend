// src/app/features/dashboard/widgets/pending-approvals-widget/pending-approvals-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HoursService } from '../../../../core/services/hours.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { IdUtils } from '../../../../core/utils/id-utils.service';

@Component({
  selector: 'app-pending-approvals-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-amber-100 dark:bg-amber-900 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-amber-600 dark:text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Pending Approvals</dt>
              <dd class="flex items-baseline">
                <div *ngIf="!loading" class="text-2xl font-semibold text-slate-900 dark:text-white">{{ pendingCount }}</div>
                <div *ngIf="loading" class="text-2xl font-semibold text-slate-400 dark:text-slate-500">...</div>
                <div *ngIf="pendingCount > 0" class="ml-2 flex items-baseline text-sm font-semibold text-red-600 dark:text-red-500">
                  <div *ngIf="isUrgent" class="animate-pulse w-2 h-2 rounded-full bg-red-500 mr-1"></div>
                  <span *ngIf="isUrgent">Urgent</span>
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
        <div class="text-sm">
          <a 
            *ngIf="hasApprovalPermission; else noPermission" 
            routerLink="/hours/all-timesheets" 
            class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            Review approvals
          </a>
          <ng-template #noPermission>
            <a 
              routerLink="/hours/my-timesheets" 
              class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
            >
              View my timesheets
            </a>
          </ng-template>
        </div>
      </div>
    </div>
  `
})
export class PendingApprovalsWidgetComponent implements OnInit {
  loading = true;
  pendingCount = 0;
  isUrgent = false;
  
  get hasApprovalPermission(): boolean {
    return this.permissionService.hasPermission('hours:approve');
  }
  
  constructor(
    private hoursService: HoursService,
    private permissionService: PermissionService,
    private authService: AuthService
  ) {}
  
  ngOnInit(): void {
    // Only load pending approvals if user has relevant permissions
    if (this.permissionService.hasPermission('hours:read')) {
      this.loadPendingApprovals();
    } else {
      this.loading = false;
    }
  }
  
  loadPendingApprovals(): void {
    // If user can approve timesheets, load pending timesheets for all employees
    if (this.hasApprovalPermission) {
      console.log('Loading pending timesheets for manager/admin approval');
      
      // Try both status values to catch all pending timesheets
      this.hoursService.getTimesheets({
        status: 'submitted',
        limit: 10
      }).subscribe({
        next: (timesheets) => {
          console.log(`Fetched ${timesheets.length} pending timesheets`);
          this.pendingCount = timesheets.length;
          
          // If there are more than 5 pending approvals, mark it as urgent
          this.isUrgent = this.pendingCount > 5;
          
          this.loading = false;
        },
        error: (err) => {
          console.error('Error loading pending timesheets:', err);
          this.loading = false;
        }
      });
    } else {
      // For regular employees, check their own pending timesheet
      this.hoursService.getCurrentEmployeeId().subscribe({
        next: (employeeId) => {
          if (employeeId) {
            const safeEmployeeId = IdUtils.ensureString(employeeId);
            console.log('Loading pending timesheets for employee:', safeEmployeeId);
            
            this.hoursService.getTimesheets({
              employee_id: safeEmployeeId,
              status: 'submitted'
            }).subscribe({
              next: (timesheets) => {
                console.log(`Fetched ${timesheets.length} pending timesheets for employee ${safeEmployeeId}`);
                this.pendingCount = timesheets.length;
                this.loading = false;
              },
              error: (err) => {
                console.error('Error loading employee timesheets:', err);
                this.loading = false;
              }
            });
          } else {
            console.log('No employee ID found for current user');
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error getting current employee ID:', err);
          this.loading = false;
        }
      });
    }
  }
}