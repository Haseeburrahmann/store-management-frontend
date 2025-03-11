// src/app/features/hours/timesheets/my-timesheets/my-timesheets.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../../core/services/hours.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { TimeEntry, WeeklyTimesheet } from '../../../../shared/models/hours.model';
import { catchError, map, Observable, of } from 'rxjs';
import { DateTimeUtils } from '../../../../core/utils/date-time-utils.service';
import { ErrorHandlingService } from '../../../../core/utils/error-handling.service';

@Component({
  selector: 'app-my-timesheets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">My Timesheets</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/hours" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hours Dashboard
          </button>
        </div>
      </div>
      
      <!-- Filter Controls -->
      <div class="card mb-6">
        <div class="flex flex-col md:flex-row gap-4">
          <div class="flex-grow">
            <label for="startDate" class="form-label">Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              [(ngModel)]="startDate" 
              (change)="loadTimeEntries()"
              class="form-control"
            >
          </div>
          <div class="flex-grow">
            <label for="endDate" class="form-label">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              [(ngModel)]="endDate" 
              (change)="loadTimeEntries()"
              class="form-control"
            >
          </div>
          <div class="flex-grow">
            <label for="statusFilter" class="form-label">Status</label>
            <select 
              id="statusFilter" 
              [(ngModel)]="statusFilter" 
              (change)="loadTimeEntries()"
              class="form-control"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div *ngIf="loading" class="flex justify-center my-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Current Timesheet Section -->
      <div *ngIf="!loading && currentTimesheet" class="card mb-6">
        <h2 class="text-lg font-semibold mb-4">Current Week Timesheet</h2>
        
        <div class="flex justify-between items-center mb-4">
          <div>
            <span class="font-medium">Week of {{ formatDate(currentTimesheet.week_start_date) }}</span>
            <div class="text-sm text-[var(--text-secondary)]">
              {{ formatDate(currentTimesheet.week_start_date) }} - {{ formatDate(currentTimesheet.week_end_date) }}
            </div>
          </div>
          <div>
            <span 
              [ngClass]="{
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': currentTimesheet.status === 'approved',
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': currentTimesheet.status === 'submitted' || currentTimesheet.status === 'draft',
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': currentTimesheet.status === 'rejected'
              }"
              class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
            >
              {{ currentTimesheet.status | titlecase }}
            </span>
          </div>
        </div>
        
        <div class="border rounded overflow-hidden mb-4">
          <table class="min-w-full divide-y divide-[var(--border-color)]">
            <thead class="bg-[var(--bg-main)]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Clock In</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Clock Out</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Break</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Hours</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-[var(--border-color)]">
              <tr *ngFor="let entry of currentWeekEntries">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                  {{ formatDate(entry.clock_in) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ formatTime(entry.clock_in) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ entry.clock_out ? formatTime(entry.clock_out) : 'In Progress' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ getBreakDuration(entry) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ formatHours(entry.total_minutes) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="flex justify-between items-center">
          <div class="text-lg font-semibold">
            Total Hours: {{ (currentTimesheet.total_hours || 0).toFixed(1) }}
          </div>
          
          <div *ngIf="currentTimesheet.status === 'draft'">
            <button 
              (click)="submitTimesheet(currentTimesheet._id || '')" 
              class="btn btn-primary"
              [disabled]="!currentTimesheet._id"
            >
              Submit Timesheet
            </button>
          </div>
        </div>
      </div>
      
      <!-- All Time Entries Section -->
      <div *ngIf="!loading" class="card">
        <h2 class="text-lg font-semibold mb-4">Time Entries</h2>
        
        <div *ngIf="timeEntries.length === 0" class="text-center py-6 text-[var(--text-secondary)]">
          No time entries found for the selected period.
        </div>
        
        <div *ngIf="timeEntries.length > 0" class="border rounded overflow-hidden">
          <table class="min-w-full divide-y divide-[var(--border-color)]">
            <thead class="bg-[var(--bg-main)]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Store</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Clock In</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Clock Out</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Hours</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-[var(--border-color)]">
              <tr *ngFor="let entry of timeEntries">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                  {{ formatDate(entry.clock_in) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ entry.store_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ formatTime(entry.clock_in) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ entry.clock_out ? formatTime(entry.clock_out) : 'In Progress' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ formatHours(entry.total_minutes) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
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
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination -->
        <div *ngIf="timeEntries.length > 0" class="mt-4 flex justify-between items-center">
          <div class="text-sm text-[var(--text-secondary)]">
            Showing {{ timeEntries.length }} entries
          </div>
          <div class="flex">
            <button 
              (click)="previousPage()" 
              class="btn btn-sm btn-outline mr-2"
              [disabled]="currentPage === 1"
            >
              Previous
            </button>
            <button 
              (click)="nextPage()" 
              class="btn btn-sm btn-outline"
              [disabled]="timeEntries.length < pageSize"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyTimesheetsComponent implements OnInit {
  loading = true;
  timeEntries: TimeEntry[] = [];
  currentTimesheet: WeeklyTimesheet | null = null;
  currentWeekEntries: TimeEntry[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  
  // Filters
  startDate: string;
  endDate: string;
  statusFilter = '';
  error: string | undefined;
  
  constructor(
    private hoursService: HoursService,
    private authService: AuthService
  ) {
    // Set default date range to the last 30 days
    const today = new Date();
    this.endDate = DateTimeUtils.formatDateForAPI(today);
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.startDate = DateTimeUtils.formatDateForAPI(thirtyDaysAgo);
  }
  
  ngOnInit(): void {
    this.loadCurrentWeekTimesheet();
    this.loadTimeEntries();
  }
  
  loadCurrentWeekTimesheet(): void {
    // Get the employee ID asynchronously
    this.hoursService.getCurrentEmployeeId().subscribe({
      next: (employeeId) => {
        if (!employeeId) {
          console.log('No employee ID found for current user');
          return;
        }
        
        this.hoursService.getCurrentTimesheet(employeeId).subscribe({
          next: (timesheet) => {
            this.currentTimesheet = timesheet;
            
            if (timesheet) {
              // Load time entries for the current timesheet
              this.loadCurrentWeekEntries(employeeId, timesheet.week_start_date, timesheet.week_end_date);
            }
          },
          error: (err) => {
            console.error('Error loading current timesheet:', err);
          }
        });
      },
      error: (err) => {
        console.error('Error getting current employee ID:', err);
      }
    });
  }
  
  loadCurrentWeekEntries(employeeId: string, startDate: string, endDate: string): void {
    this.hoursService.getTimeEntries({
      employee_id: employeeId,
      start_date: startDate,
      end_date: endDate
    }).subscribe({
      next: (entries) => {
        this.currentWeekEntries = entries;
      },
      error: (err) => {
        console.error('Error loading current week entries:', err);
      }
    });
  }
  
  loadTimeEntries(): void {
    this.loading = true;
    
    // Get the employee ID asynchronously
    this.hoursService.getCurrentEmployeeId().subscribe({
      next: (employeeId) => {
        if (!employeeId) {
          console.log('No employee ID found for current user');
          this.timeEntries = []; // Empty array since there's no employee
          this.loading = false;
          return;
        }
        
        const options: any = {
          employee_id: employeeId,
          skip: (this.currentPage - 1) * this.pageSize,
          limit: this.pageSize
        };
        
        if (this.startDate) {
          options.start_date = this.startDate;
        }
        
        if (this.endDate) {
          options.end_date = this.endDate;
        }
        
        if (this.statusFilter) {
          options.status = this.statusFilter;
        }
        
        this.hoursService.getTimeEntries(options).subscribe({
          next: (entries) => {
            this.timeEntries = entries;
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading time entries:', err);
            this.error = ErrorHandlingService.getErrorMessage(err);
            this.timeEntries = []; // Empty array on error
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error getting employee ID:', err);
        this.timeEntries = []; // Empty array on error
        this.loading = false;
      }
    });
  }
  
  submitTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot submit timesheet: Missing timesheet ID');
      return;
    }
    
    this.hoursService.submitTimesheet(timesheetId).subscribe({
      next: (updatedTimesheet) => {
        this.currentTimesheet = updatedTimesheet;
      },
      error: (err) => {
        console.error('Error submitting timesheet:', err);
        alert(ErrorHandlingService.getErrorMessage(err));
      }
    });
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTimeEntries();
    }
  }
  
  nextPage(): void {
    if (this.timeEntries.length === this.pageSize) {
      this.currentPage++;
      this.loadTimeEntries();
    }
  }
  
  getBreakDuration(entry: TimeEntry): string {
    if (!entry.break_start || !entry.break_end) {
      return 'None';
    }
    
    const breakMinutes = DateTimeUtils.calculateDurationMinutes(entry.break_start, entry.break_end);
    return DateTimeUtils.formatDuration(breakMinutes);
  }
  
  formatHours(minutes?: number): string {
    if (!minutes) return '0h';
    return DateTimeUtils.formatDuration(minutes);
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  formatTime(dateStr: string): string {
    return DateTimeUtils.formatTimeForDisplay(dateStr);
  }
}