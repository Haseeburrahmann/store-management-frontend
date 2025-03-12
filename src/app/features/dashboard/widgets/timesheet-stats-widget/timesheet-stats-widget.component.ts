// src/app/features/dashboard/widgets/timesheet-stats-widget/timesheet-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HoursService } from '../../../../core/services/hours.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';

@Component({
  selector: 'app-timesheet-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-cyan-100 dark:bg-cyan-900 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Timesheet Status</dt>
              <dd class="flex items-baseline">
                <div *ngIf="!loading" class="text-2xl font-semibold text-slate-900 dark:text-white">
                  {{ timesheetStatus }}
                </div>
                <div *ngIf="loading" class="text-2xl font-semibold text-slate-400 dark:text-slate-500">...</div>
                <div *ngIf="!loading && statusIndicator" 
                    class="ml-2 flex items-baseline text-sm font-semibold" 
                    [ngClass]="statusColor">
                  {{ statusIndicator }}
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
        <div class="text-sm">
          <a routerLink="/timesheets/current" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">Manage timesheet</a>
        </div>
      </div>
    </div>
  `
})
export class TimesheetStatsWidgetComponent implements OnInit {
  loading = true;
  timesheetStatus = 'No Active Timesheet';
  statusIndicator = '';
  statusColor = '';
  
  constructor(
    private hoursService: HoursService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Only load data if user has permission to view hours
    if (this.permissionService.hasPermission('hours:read')) {
      this.loadTimesheetStats();
    } else {
      this.loading = false;
    }
  }
  
  loadTimesheetStats(): void {
    this.hoursService.getCurrentTimesheet().subscribe({
      next: (timesheet) => {
        if (timesheet) {
          switch (timesheet.status) {
            case 'draft':
              this.timesheetStatus = 'Draft';
              this.statusIndicator = 'Needs submission';
              this.statusColor = 'text-slate-600 dark:text-slate-400';
              break;
            case 'submitted':
              this.timesheetStatus = 'Pending Approval';
              this.statusIndicator = 'Awaiting manager';
              this.statusColor = 'text-yellow-600 dark:text-yellow-400';
              break;
            case 'approved':
              this.timesheetStatus = 'Approved';
              this.statusIndicator = 'Complete';
              this.statusColor = 'text-green-600 dark:text-green-400';
              break;
            case 'rejected':
              this.timesheetStatus = 'Rejected';
              this.statusIndicator = 'Needs revision';
              this.statusColor = 'text-red-600 dark:text-red-400';
              break;
            default:
              this.timesheetStatus = 'Unknown';
              this.statusIndicator = '';
          }
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading timesheet stats:', err);
        this.loading = false;
      }
    });
  }
}