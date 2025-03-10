// src/app/features/hours/dashboard/hours-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterOutlet } from '@angular/router';
import { HoursService } from '../../../core/services/hours.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { TimeEntry, WeeklyTimesheet } from '../../../shared/models/hours.model';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-hours-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterOutlet, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Hours Management</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <!-- Quick Actions -->
          <div *appHasPermission="'hours:write'">
            <button 
              routerLink="/hours/time-clock" 
              class="btn btn-primary mr-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Time Clock
            </button>
          </div>
          
          <div *appHasPermission="'hours:write'">
            <button 
              routerLink="/hours/schedules" 
              class="btn btn-outline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              View Schedules
            </button>
          </div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div *ngIf="loading" class="flex justify-center my-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Hours Dashboard Content -->
      <div *ngIf="!loading" class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Left Column: Quick Summary -->
        <div class="lg:col-span-1">
          <!-- Time Clock Status Card -->
          <div class="card mb-6">
            <h2 class="text-lg font-semibold mb-4">Time Clock Status</h2>
            
            <div *ngIf="activeTimeEntry; else notClockedIn" class="bg-green-100 dark:bg-green-900 p-4 rounded-md text-green-800 dark:text-green-200 mb-4">
              <div class="flex items-center font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>You are currently clocked in</span>
              </div>
              <div class="text-sm mt-2">
                <p><strong>Clock In:</strong> {{ formatDateTime(activeTimeEntry.clock_in) }}</p>
                <p><strong>Location:</strong> {{ activeTimeEntry.store_name }}</p>
                <p><strong>Duration:</strong> {{ calculateCurrentDuration(activeTimeEntry.clock_in) }}</p>
              </div>
              <div class="mt-4">
                <button 
                  (click)="clockOut(activeTimeEntry._id || '')" 
                  class="btn btn-sm bg-green-700 hover:bg-green-800 text-white"
                  [disabled]="!activeTimeEntry._id"
                >
                  Clock Out Now
                </button>
              </div>
            </div>
            
            <ng-template #notClockedIn>
              <div class="bg-slate-100 dark:bg-slate-700 p-4 rounded-md mb-4">
                <div class="flex items-center font-medium text-[var(--text-primary)]">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>You are not clocked in</span>
                </div>
                <div class="mt-4" *appHasPermission="'hours:write'">
                  <a 
                    routerLink="/hours/time-clock" 
                    class="btn btn-sm btn-primary"
                  >
                    Go to Time Clock
                  </a>
                </div>
              </div>
            </ng-template>
            
            <h3 class="text-md font-medium mb-2">Recent Time Entries</h3>
            <div *ngIf="recentTimeEntries.length === 0" class="text-[var(--text-secondary)] text-sm">
              No recent time entries found.
            </div>
            <div *ngFor="let entry of recentTimeEntries" class="border-b border-[var(--border-color)] py-2 last:border-b-0">
              <div class="flex justify-between items-center">
                <div>
                  <div class="font-medium">{{ formatDate(entry.clock_in) }}</div>
                  <div class="text-xs text-[var(--text-secondary)]">
                    {{ formatTime(entry.clock_in) }} - {{ entry.clock_out ? formatTime(entry.clock_out) : 'In Progress' }}
                  </div>
                </div>
                <div>
                  <span 
                    [ngClass]="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': entry.status === 'approved',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': entry.status === 'pending',
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': entry.status === 'rejected'
                    }"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  >
                    {{ entry.status | titlecase }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="mt-4 text-center">
              <a routerLink="/hours/my-timesheets" class="btn btn-sm btn-outline">
                View All Time Entries
              </a>
            </div>
          </div>
          
          <!-- Current Week Summary Card -->
          <div class="card">
            <h2 class="text-lg font-semibold mb-4">Current Week Summary</h2>
            <div *ngIf="currentWeekStats" class="space-y-4">
              <div class="flex justify-between items-center">
                <span class="text-[var(--text-secondary)]">Week of {{ formatDate(currentWeekStats.weekStart) }}</span>
                <span class="font-medium">{{ currentWeekStats.totalHours.toFixed(1) }} hours</span>
              </div>
              
              <div class="bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  class="bg-green-500 h-2 rounded-full" 
                  [style.width.%]="getProgressPercentage(currentWeekStats.totalHours, 40)"
                ></div>
              </div>
              
              <div class="grid grid-cols-7 gap-1 text-center text-xs">
                <ng-container *ngFor="let day of weekDays; let i = index">
                  <div class="flex flex-col">
                    <span class="text-[var(--text-secondary)]">{{ day }}</span>
                    <span 
                      [class.font-medium]="currentWeekStats.dailyHours[i] > 0"
                      [class.text-green-600]="currentWeekStats.dailyHours[i] > 0"
                    >
                      {{ currentWeekStats.dailyHours[i].toFixed(1) }}h
                    </span>
                  </div>
                </ng-container>
              </div>
            </div>
            
            <div *ngIf="!currentWeekStats" class="text-[var(--text-secondary)] text-sm">
              No hours recorded for the current week.
            </div>
          </div>
        </div>
        
        <!-- Right Column - Manager View -->
        <div class="lg:col-span-2">
          <!-- Pending Approvals for Managers -->
          <div *appHasPermission="'hours:approve'" class="card mb-6">
            <h2 class="text-lg font-semibold mb-4">Pending Approvals</h2>
            
            <div *ngIf="pendingTimesheets.length === 0" class="text-[var(--text-secondary)] text-sm mb-4">
              No timesheets pending approval.
            </div>
            
            <div *ngFor="let timesheet of pendingTimesheets" class="border-b border-[var(--border-color)] py-4 last:border-b-0">
              <div class="flex justify-between items-start">
                <div>
                  <div class="font-medium">{{ timesheet.employee_name }}</div>
                  <div class="text-sm text-[var(--text-secondary)]">
                    Week of {{ formatDate(timesheet.week_start_date) }} • {{ timesheet.total_hours }} hours
                  </div>
                </div>
                <div class="flex">
                  <button 
                    (click)="approveTimesheet(timesheet._id || '')"
                    class="btn btn-xs btn-success mr-2"
                    [disabled]="!timesheet._id"
                  >
                    Approve
                  </button>
                  <button 
                    (click)="rejectTimesheet(timesheet._id || '')"
                    class="btn btn-xs btn-danger"
                    [disabled]="!timesheet._id"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
            
            <div *ngIf="pendingTimesheets.length > 0" class="mt-4 text-center">
              <a routerLink="/hours/all-timesheets" class="btn btn-sm btn-outline">
                View All Timesheets
              </a>
            </div>
          </div>
          
          <!-- Schedule Overview for Everyone -->
          <div class="card">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-semibold">Current Schedule</h2>
              <a routerLink="/hours/schedules" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                View All Schedules
              </a>
            </div>
            
            <div *ngIf="upcomingShifts.length === 0" class="text-[var(--text-secondary)] text-sm mb-4">
              No upcoming shifts scheduled.
            </div>
            
            <div *ngFor="let shift of upcomingShifts" class="border-b border-[var(--border-color)] py-3 last:border-b-0">
              <div class="flex items-start">
                <div class="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mr-3 flex-shrink-0">
                  <span class="text-[var(--text-secondary)] text-sm font-medium">
                    {{ getDayAbbreviation(shift.date) }}
                  </span>
                </div>
                <div class="flex-grow">
                  <div class="font-medium">{{ formatDate(shift.date) }}</div>
                  <div class="text-sm text-[var(--text-secondary)]">
                    {{ formatTimeFromHHMM(shift.start_time) }} - {{ formatTimeFromHHMM(shift.end_time) }}
                  </div>
                </div>
                <div class="ml-2 text-right">
                  <div class="text-xs text-[var(--text-secondary)]">Hours</div>
                  <div class="font-medium">{{ calculateShiftHours(shift.start_time, shift.end_time) }}</div>
                </div>
              </div>
            </div>
            
            <!-- Create Schedule Button for Managers -->
            <div *appHasPermission="'hours:write'" class="mt-4 text-center">
              <a routerLink="/hours/schedules/create" class="btn btn-sm btn-primary">
                Create New Schedule
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class HoursDashboardComponent implements OnInit {
  loading = true;
  activeTimeEntry: TimeEntry | null = null;
  recentTimeEntries: TimeEntry[] = [];
  pendingTimesheets: WeeklyTimesheet[] = [];
  upcomingShifts: any[] = []; // Use ScheduleShift type when implemented
  
  // For the weekly summary
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  currentWeekStats: {
    weekStart: string;
    weekEnd: string;
    totalHours: number;
    dailyHours: number[];
  } | null = null;
  
  constructor(
    private hoursService: HoursService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.loadDashboardData();
  }
  
  loadDashboardData(): void {
    this.loading = true;
    
    // Get current user information
    const currentUser = this.authService.currentUser;
    if (!currentUser) {
      console.error('No authenticated user found');
      this.loading = false;
      return;
    }
    
    // For demonstration purposes, we'll use the user ID as employee ID
    // In a real application, you would get the employee ID associated with the user
    const employeeId = currentUser._id;
    
    // Get active time entry
    this.hoursService.getActiveTimeEntry(employeeId).subscribe({
      next: (entry) => {
        this.activeTimeEntry = entry;
        
        // Load recent time entries
        this.loadRecentTimeEntries(employeeId);
        
        // Load current week stats
        this.calculateCurrentWeekStats(employeeId);
        
        // For managers, load pending timesheets
        if (this.permissionService.hasPermission('hours:approve')) {
          this.loadPendingTimesheets();
        }
        
        // Load upcoming shifts
        this.loadUpcomingShifts(employeeId);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching active time entry:', err);
        this.loading = false;
      }
    });
  }
  
  loadRecentTimeEntries(employeeId: string): void {
    // Get the last 7 days of time entries
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    this.hoursService.getTimeEntries({
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate,
      limit: 5
    }).subscribe({
      next: (entries) => {
        this.recentTimeEntries = entries;
      },
      error: (err) => {
        console.error('Error fetching recent time entries:', err);
      }
    });
  }
  
  calculateCurrentWeekStats(employeeId: string): void {
    const now = new Date();
    const weekStart = this.hoursService.getStartOfWeek(now);
    const weekEnd = this.hoursService.getEndOfWeek(now);
    
    this.hoursService.getTimeEntries({
      employee_id: employeeId,
      start_date: weekStart.toISOString().split('T')[0],
      end_date: weekEnd.toISOString().split('T')[0]
    }).subscribe({
      next: (entries) => {
        if (entries.length === 0) {
          this.currentWeekStats = null;
          return;
        }
        
        // Initialize daily hours array with zeros
        const dailyHours = [0, 0, 0, 0, 0, 0, 0];
        let totalHours = 0;
        
        // Calculate hours for each entry
        entries.forEach(entry => {
          if (entry.clock_in && entry.clock_out) {
            const minutes = this.hoursService.calculateTimeDifference(entry.clock_in, entry.clock_out);
            const hours = minutes / 60;
            totalHours += hours;
            
            // Determine which day of the week this entry belongs to
            const entryDate = new Date(entry.clock_in);
            const dayOfWeek = entryDate.getDay(); // 0 = Sunday, 6 = Saturday
            
            dailyHours[dayOfWeek] += hours;
          }
        });
        
        this.currentWeekStats = {
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          totalHours: totalHours,
          dailyHours: dailyHours
        };
      },
      error: (err) => {
        console.error('Error calculating current week stats:', err);
      }
    });
  }
  
  loadPendingTimesheets(): void {
    this.hoursService.getTimesheets({
      status: 'submitted',
      limit: 5
    }).subscribe({
      next: (timesheets) => {
        this.pendingTimesheets = timesheets;
      },
      error: (err) => {
        console.error('Error fetching pending timesheets:', err);
      }
    });
  }
  
  loadUpcomingShifts(employeeId: string): void {
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    // Get date 7 days from now
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    const nextWeekStr = nextWeek.toISOString().split('T')[0];
    
    this.hoursService.getEmployeeSchedule(employeeId, today, nextWeekStr).subscribe({
      next: (shifts) => {
        this.upcomingShifts = shifts;
      },
      error: (err) => {
        console.error('Error fetching upcoming shifts:', err);
      }
    });
  }
  
  clockOut(timeEntryId: string): void {
    if (!timeEntryId) {
      console.error('Cannot clock out: Missing time entry ID');
      return;
    }
    
    this.hoursService.clockOut(timeEntryId).subscribe({
      next: () => {
        this.activeTimeEntry = null;
        this.loadDashboardData(); // Reload all data
      },
      error: (err) => {
        console.error('Error clocking out:', err);
      }
    });
  }
  
  approveTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot approve timesheet: Missing timesheet ID');
      return;
    }
    
    this.hoursService.approveTimesheet(timesheetId).subscribe({
      next: () => {
        // Remove the approved timesheet from the list
        this.pendingTimesheets = this.pendingTimesheets.filter(ts => ts._id !== timesheetId);
      },
      error: (err) => {
        console.error('Error approving timesheet:', err);
      }
    });
  }
  
  rejectTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot reject timesheet: Missing timesheet ID');
      return;
    }
    
    // In a real application, you would show a dialog to capture the rejection reason
    const reason = prompt('Please enter a reason for rejecting this timesheet:');
    if (reason) {
      this.hoursService.rejectTimesheet(timesheetId, reason).subscribe({
        next: () => {
          // Remove the rejected timesheet from the list
          this.pendingTimesheets = this.pendingTimesheets.filter(ts => ts._id !== timesheetId);
        },
        error: (err) => {
          console.error('Error rejecting timesheet:', err);
        }
      });
    }
  }
  
  // Helper methods for formatting dates and times
  formatDateTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleString();
  }
  
  formatDate(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleDateString();
  }
  
  formatTime(dateTimeStr: string): string {
    const date = new Date(dateTimeStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  formatTimeFromHHMM(timeStr: string): string {
    // Input format: "HH:MM" (24-hour)
    const [hours, minutes] = timeStr.split(':').map(num => parseInt(num, 10));
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  
  calculateCurrentDuration(startTimeStr: string): string {
    const startTime = new Date(startTimeStr);
    const now = new Date();
    const durationMinutes = Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  }
  
  calculateShiftHours(startTime: string, endTime: string): string {
    const [startHours, startMinutes] = startTime.split(':').map(num => parseInt(num, 10));
    const [endHours, endMinutes] = endTime.split(':').map(num => parseInt(num, 10));
    
    let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60; // Handle overnight shifts
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    return `${hours}h ${minutes > 0 ? minutes + 'm' : ''}`;
  }
  
  getDayAbbreviation(dateStr: string): string {
    const date = new Date(dateStr);
    return this.weekDays[date.getDay()];
  }
  
  getProgressPercentage(hours: number, targetHours: number): number {
    return Math.min(Math.round((hours / targetHours) * 100), 100);
  }
}