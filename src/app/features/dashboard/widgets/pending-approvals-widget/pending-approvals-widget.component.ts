// src/app/features/dashboard/widgets/pending-approvals-widget/pending-approvals-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HoursService } from '../../../../core/services/hours.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { IdUtils } from '../../../../core/utils/id-utils.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-pending-approvals-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <h3 class="text-lg font-medium mb-4">Pending Approvals</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Timesheet Approvals -->
          <div class="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
              <h4 class="font-medium">Timesheets</h4>
              <span class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                {{ pendingTimesheets }} Pending
              </span>
            </div>
            
            <div class="p-4">
              <div *ngIf="loading.timesheets" class="flex justify-center py-4">
                <div class="w-6 h-6 border-2 border-t-2 border-primary-500 rounded-full animate-spin"></div>
              </div>
              
              <div *ngIf="!loading.timesheets">
                <div *ngIf="pendingTimesheets === 0" class="text-sm text-slate-500 dark:text-slate-400 py-2">
                  No pending timesheet approvals.
                </div>
                
                <div *ngIf="pendingTimesheets > 0" class="text-sm text-slate-700 dark:text-slate-300 py-2">
                  You have {{ pendingTimesheets }} timesheet{{ pendingTimesheets > 1 ? 's' : '' }} pending approval.
                </div>
                
                <div *ngIf="pendingTimesheets > 0" class="mt-3">
                  <a 
                    routerLink="/timesheets/approval" 
                    class="btn btn-sm btn-primary"
                  >
                    Review Timesheets
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Schedule Management -->
          <div class="rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div class="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
              <h4 class="font-medium">Schedules</h4>
              <span *ngIf="hasCurrentSchedule" class="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                Active
              </span>
              <span *ngIf="!hasCurrentSchedule" class="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2.5 py-0.5 rounded-full text-xs font-medium">
                Needs Setup
              </span>
            </div>
            
            <div class="p-4">
              <div *ngIf="loading.schedules" class="flex justify-center py-4">
                <div class="w-6 h-6 border-2 border-t-2 border-primary-500 rounded-full animate-spin"></div>
              </div>
              
              <div *ngIf="!loading.schedules">
                <div *ngIf="!hasCurrentSchedule" class="text-sm text-slate-700 dark:text-slate-300 py-2">
                  No active schedule for the current week.
                </div>
                
                <div *ngIf="hasCurrentSchedule" class="text-sm text-slate-700 dark:text-slate-300 py-2">
                  Current week schedule is active with {{ currentScheduleShifts }} shifts.
                </div>
                
                <div class="mt-3">
                  <a 
                    routerLink="/schedules" 
                    class="btn btn-sm btn-primary"
                  >
                    {{ hasCurrentSchedule ? 'View Schedule' : 'Create Schedule' }}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div *ngIf="!hasApprovalPermission && loading.timesheets === false" class="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          <p>You don't have permission to approve timesheets.</p>
          <a routerLink="/timesheets" class="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300">
            View your timesheets
          </a>
        </div>
      </div>
    </div>
  `
})
export class PendingApprovalsWidgetComponent implements OnInit {
  loading = {
    timesheets: true,
    schedules: true
  };
  
  pendingTimesheets = 0;
  hasCurrentSchedule = false;
  currentScheduleShifts = 0;
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
      this.loadCurrentSchedule();
    } else {
      this.loading.timesheets = false;
      this.loading.schedules = false;
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
          this.pendingTimesheets = timesheets.length;
          
          // If there are more than 5 pending approvals, mark it as urgent
          this.isUrgent = this.pendingTimesheets > 5;
          
          this.loading.timesheets = false;
        },
        error: (err) => {
          console.error('Error loading pending timesheets:', err);
          this.loading.timesheets = false;
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
                this.pendingTimesheets = timesheets.length;
                this.loading.timesheets = false;
              },
              error: (err) => {
                console.error('Error loading employee timesheets:', err);
                this.loading.timesheets = false;
              }
            });
          } else {
            console.log('No employee ID found for current user');
            this.loading.timesheets = false;
          }
        },
        error: (err) => {
          console.error('Error getting current employee ID:', err);
          this.loading.timesheets = false;
        }
      });
    }
  }
  
  loadCurrentSchedule(): void {
    console.log('Loading current schedule for dashboard widget');
    
    // If user is an employee, use the employee-specific endpoint
    if (this.permissionService.getRoleIdentifier() === 'employee') {
      this.hoursService.getMyScheduleShifts().subscribe({
        next: (shifts) => {
          const hasShifts = shifts && shifts.length > 0;
          this.hasCurrentSchedule = hasShifts;
          this.currentScheduleShifts = hasShifts ? shifts.length : 0;
          this.loading.schedules = false;
        },
        error: (err) => {
          console.error('Error loading employee schedule:', err);
          this.loading.schedules = false;
          this.hasCurrentSchedule = false;
        }
      });
    } else {
      // Use the getCurrentSchedule method for admins/managers
      this.hoursService.getCurrentSchedule().subscribe({
        next: (schedule) => {
          if (schedule && schedule.shifts && schedule.shifts.length > 0) {
            console.log(`Found current schedule with ${schedule.shifts.length} shifts`);
            this.hasCurrentSchedule = true;
            this.currentScheduleShifts = schedule.shifts.length;
          } else {
            console.log('No current schedule found or no shifts in schedule');
            this.hasCurrentSchedule = false;
            this.currentScheduleShifts = 0;
          }
          this.loading.schedules = false;
        },
        error: (err) => {
          console.error('Error loading current schedule:', err);
          this.loading.schedules = false;
          this.hasCurrentSchedule = false;
        }
      });
    }
  }
}