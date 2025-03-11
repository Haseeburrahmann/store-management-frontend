// src/app/features/hours/timesheets/timesheet-detail/timesheet-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../../core/services/hours.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { TimeEntry, WeeklyTimesheet } from '../../../../shared/models/hours.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';
import { DateTimeUtils } from '../../../../core/utils/date-time-utils.service';
import { ErrorHandlingService } from '../../../../core/utils/error-handling.service';
import { IdUtils } from '../../../../core/utils/id-utils.service';

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Timesheet Details</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button 
            (click)="goBack()" 
            class="btn btn-outline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div *ngIf="loading" class="flex justify-center my-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Error Message -->
      <div *ngIf="error" class="alert alert-danger mb-6">
        {{ error }}
      </div>
      
      <!-- Timesheet Details -->
      <ng-container *ngIf="!loading && timesheet">
        <div class="card mb-6">
          <div class="flex flex-col md:flex-row justify-between mb-6">
            <div>
              <h2 class="text-xl font-semibold">
                Week of {{ formatDate(timesheet.week_start_date) }}
              </h2>
              <p class="text-[var(--text-secondary)]">
                {{ formatDate(timesheet.week_start_date) }} to {{ formatDate(timesheet.week_end_date) }}
              </p>
              <p class="mt-2">
                <span class="font-medium">Employee:</span> {{ timesheet.employee_name }}
              </p>
              <p>
                <span class="font-medium">Store:</span> {{ timesheet.store_name }}
              </p>
            </div>
            
            <div class="mt-4 md:mt-0 md:text-right">
              <div class="mb-2">
                <span 
                  [ngClass]="{
                    'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': timesheet.status === 'approved',
                    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': timesheet.status === 'submitted' || timesheet.status === 'draft',
                    'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': timesheet.status === 'rejected'
                  }"
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                >
                  {{ timesheet.status | titlecase }}
                </span>
              </div>
              
              <div *ngIf="timesheet.submitted_at" class="text-sm text-[var(--text-secondary)]">
                Submitted: {{ formatDateTime(timesheet.submitted_at) }}
              </div>
              
              <div *ngIf="timesheet.approved_at" class="text-sm text-[var(--text-secondary)]">
                Approved: {{ formatDateTime(timesheet.approved_at) }}
              </div>
              
              <div *ngIf="canManageTimesheet" class="mt-4">
                <button 
                  *ngIf="timesheet.status === 'draft'"
                  (click)="submitTimesheet(timesheet._id || '')"
                  class="btn btn-primary btn-sm mr-2"
                  [disabled]="!timesheet._id"
                >
                  Submit
                </button>
                
                <button 
                  *ngIf="timesheet.status === 'submitted' && hasApprovalPermission"
                  (click)="approveTimesheet(timesheet._id || '')"
                  class="btn btn-success btn-sm mr-2"
                  [disabled]="!timesheet._id"
                >
                  Approve
                </button>
                
                <button 
                  *ngIf="timesheet.status === 'submitted' && hasApprovalPermission"
                  (click)="rejectTimesheet(timesheet._id || '')"
                  class="btn btn-danger btn-sm"
                  [disabled]="!timesheet._id"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
          
          <div *ngIf="timesheet.rejection_reason" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-4 mb-6">
            <div class="font-medium text-red-800 dark:text-red-300">Rejection Reason:</div>
            <div class="text-red-700 dark:text-red-300">{{ timesheet.rejection_reason }}</div>
          </div>
          
          <div *ngIf="timesheet.notes" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-4 mb-6">
            <div class="font-medium">Notes:</div>
            <div class="text-[var(--text-secondary)]">{{ timesheet.notes }}</div>
          </div>
          
          <div class="border rounded overflow-hidden mb-6">
            <table class="min-w-full divide-y divide-[var(--border-color)]">
              <thead class="bg-[var(--bg-main)]">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Date</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Clock In</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Clock Out</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Break</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Hours</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                  <th *ngIf="canManageTimesheet" class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-slate-800 divide-y divide-[var(--border-color)]">
                <tr *ngFor="let entry of timeEntries">
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
                  <td *ngIf="canManageTimesheet" class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                    <button 
                      *ngIf="canEditTimeEntry(entry)"
                      (click)="editTimeEntry(entry)"
                      class="btn btn-xs btn-outline mr-1"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              </tbody>
              <tfoot class="bg-[var(--bg-main)]">
                <tr>
                  <td colspan="4" class="px-6 py-3 text-right font-medium">Total Hours:</td>
                  <td class="px-6 py-3 font-medium">{{ formatHours(calculateTotalMinutes()) }}</td>
                  <td colspan="2"></td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <!-- Edit Time Entry Modal -->
          <div *ngIf="editingEntry" class="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-6">
            <h3 class="text-lg font-medium mb-4">Edit Time Entry</h3>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div class="form-group">
                <label class="form-label">Date</label>
                <div class="text-[var(--text-primary)]">{{ formatDate(editingEntry.clock_in) }}</div>
              </div>
              
              <div class="form-group">
                <label for="clockIn" class="form-label">Clock In Time</label>
                <input 
                  type="time" 
                  id="clockIn" 
                  [(ngModel)]="editClockInTime"
                  class="form-control"
                >
              </div>
              
              <div class="form-group">
                <label for="clockOut" class="form-label">Clock Out Time</label>
                <input 
                  type="time" 
                  id="clockOut" 
                  [(ngModel)]="editClockOutTime"
                  class="form-control"
                >
              </div>
              
              <div class="form-group">
                <label for="notes" class="form-label">Notes</label>
                <input 
                  type="text" 
                  id="notes" 
                  [(ngModel)]="editNotes"
                  class="form-control"
                >
              </div>
            </div>
            
            <div class="flex justify-end">
              <button 
                (click)="cancelEdit()" 
                class="btn btn-outline mr-2"
              >
                Cancel
              </button>
              <button 
                (click)="saveTimeEntry()" 
                class="btn btn-primary"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class TimesheetDetailComponent implements OnInit {
  loading = true;
  error = '';
  timesheetId = '';
  timesheet: WeeklyTimesheet | null = null;
  timeEntries: TimeEntry[] = [];
  
  // For edit functionality
  editingEntry: TimeEntry | null = null;
  editClockInTime = '';
  editClockOutTime = '';
  editNotes = '';
  
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private hoursService: HoursService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.timesheetId = this.route.snapshot.paramMap.get('id') || '';
    this.loadTimesheet();
  }
  
  loadTimesheet(): void {
    if (!this.timesheetId) {
      this.error = 'No timesheet ID provided';
      this.loading = false;
      return;
    }
    
    this.hoursService.getTimesheet(this.timesheetId).subscribe({
      next: (timesheet) => {
        this.timesheet = timesheet;
        this.loadTimeEntries();
      },
      error: (err) => {
        console.error('Error loading timesheet:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  loadTimeEntries(): void {
    if (!this.timesheet) {
      this.loading = false;
      return;
    }
    
    // Fetch time entries for this timesheet
    this.hoursService.getTimeEntries({
      employee_id: this.timesheet.employee_id,
      start_date: this.timesheet.week_start_date,
      end_date: this.timesheet.week_end_date
    }).subscribe({
      next: (entries) => {
        this.timeEntries = entries;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading time entries:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  get canManageTimesheet(): boolean {
    if (!this.timesheet) return false;
    
    const currentUser = this.authService.currentUser;
    if (!currentUser) return false;
    
    // Users can manage their own timesheets
    const isOwnTimesheet = IdUtils.areEqual(this.timesheet.employee_id, currentUser._id);
    
    // Users with approval permissions can manage any timesheet
    const hasApprovalPermission = this.permissionService.hasPermission('hours:approve');
    
    return isOwnTimesheet || hasApprovalPermission;
  }
  
  get hasApprovalPermission(): boolean {
    return this.permissionService.hasPermission('hours:approve');
  }
  
  canEditTimeEntry(entry: TimeEntry): boolean {
    // Only allow editing if the timesheet is in draft status
    if (!this.timesheet || this.timesheet.status !== 'draft') {
      return false;
    }
    
    // Only allow editing pending entries
    return entry.status === 'pending';
  }
  
  goBack(): void {
    // Use window.history to go back if possible
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Otherwise navigate to the timesheet list
      this.router.navigate(['/hours/my-timesheets']);
    }
  }
  
  submitTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot submit timesheet: Missing timesheet ID');
      return;
    }
    
    this.hoursService.submitTimesheet(timesheetId).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
      },
      error: (err) => {
        console.error('Error submitting timesheet:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
      }
    });
  }
  
  approveTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot approve timesheet: Missing timesheet ID');
      return;
    }
    
    this.hoursService.approveTimesheet(timesheetId).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
      },
      error: (err) => {
        console.error('Error approving timesheet:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
      }
    });
  }
  
  rejectTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot reject timesheet: Missing timesheet ID');
      return;
    }
    
    const reason = prompt('Please enter a reason for rejecting this timesheet:');
    if (!reason) return;
    
    this.hoursService.rejectTimesheet(timesheetId, reason).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
      },
      error: (err) => {
        console.error('Error rejecting timesheet:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
      }
    });
  }
  
  editTimeEntry(entry: TimeEntry): void {
    this.editingEntry = entry;
    
    // Set initial values for the edit form
    const clockInDate = new Date(entry.clock_in);
    this.editClockInTime = this.formatTimeForInput(clockInDate);
    
    if (entry.clock_out) {
      const clockOutDate = new Date(entry.clock_out);
      this.editClockOutTime = this.formatTimeForInput(clockOutDate);
    } else {
      this.editClockOutTime = '';
    }
    
    this.editNotes = entry.notes || '';
  }
  
  cancelEdit(): void {
    this.editingEntry = null;
  }
  
  saveTimeEntry(): void {
    if (!this.editingEntry) return;
    
    // Prepare the updated time entry
    const entryDate = new Date(this.editingEntry.clock_in);
    const clockInDate = this.createDateWithTime(entryDate, this.editClockInTime);
    const clockOutDate = this.createDateWithTime(entryDate, this.editClockOutTime);
    
    const updatedEntry: Partial<TimeEntry> = {
      clock_in: clockInDate.toISOString(),
      notes: this.editNotes
    };
    
    if (this.editClockOutTime) {
      updatedEntry.clock_out = clockOutDate.toISOString();
      
      // Calculate total minutes
      const durationMinutes = DateTimeUtils.calculateDurationMinutes(
        updatedEntry.clock_in || this.editingEntry.clock_in, 
        updatedEntry.clock_out || ''
      );
      updatedEntry.total_minutes = durationMinutes;
    }
    
    // Update the time entry
    this.hoursService.updateTimeEntry(this.editingEntry._id || '', updatedEntry).subscribe({
      next: (entry) => {
        // Update the entry in the local array
        const index = this.timeEntries.findIndex(e => IdUtils.areEqual(e._id, entry._id));
        if (index !== -1) {
          this.timeEntries[index] = entry;
        }
        
        this.editingEntry = null;
      },
      error: (err) => {
        console.error('Error updating time entry:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
      }
    });
  }
  
  calculateTotalMinutes(): number {
    return this.timeEntries.reduce((total, entry) => total + (entry.total_minutes || 0), 0);
  }
  
  // Helper methods
  formatDateTime(dateStr?: string): string {
    if (!dateStr) return '';
    return DateTimeUtils.formatDateForDisplay(dateStr, { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  formatTime(dateStr: string): string {
    return DateTimeUtils.formatTimeForDisplay(dateStr);
  }
  
  formatTimeForInput(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
  
  createDateWithTime(date: Date, timeStr: string): Date {
    const result = new Date(date);
    const [hours, minutes] = timeStr.split(':').map(Number);
    result.setHours(hours, minutes, 0, 0);
    return result;
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
}