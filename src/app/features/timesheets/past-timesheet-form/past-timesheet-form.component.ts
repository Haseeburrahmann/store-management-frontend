// src/app/features/timesheets/past-timesheet-form/past-timesheet-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { Store } from '../../../shared/models/store.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { TimesheetUtils, Schedule } from '../../../shared/models/hours.model';

interface WeekOption {
  startDate: Date;
  endDate: Date;
  weekNumber: number;
  year: number;
  label: string;
  isWithinGracePeriod: boolean;
  remainingDays: number;
}

@Component({
  selector: 'app-past-timesheet-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Create Past Timesheet</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button 
            (click)="navigateBack()" 
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
        <button (click)="error = ''" class="ml-2">×</button>
      </div>
      
      <!-- No available weeks -->
      <div *ngIf="!loading && availableWeeks.length === 0 && !error" class="card mb-6">
        <div class="text-center py-8">
          <h2 class="text-xl font-medium mb-2">No Available Past Weeks</h2>
          <p class="text-[var(--text-secondary)] mb-4">
            There are no past weeks available for timesheet creation. This could be because:
          </p>
          <ul class="list-disc list-inside text-left max-w-lg mx-auto mb-4">
            <li>You already have timesheets for all available past weeks</li>
            <li>The grace period for creating past timesheets has expired</li>
            <li>You don't have permission to create timesheets</li>
          </ul>
          <a 
            routerLink="/timesheets" 
            class="btn btn-primary"
          >
            Return to Timesheets
          </a>
        </div>
      </div>
      
      <!-- Form -->
      <div *ngIf="!loading && availableWeeks.length > 0" class="card mb-6">
        <h2 class="text-lg font-medium mb-6">Select Week and Store</h2>
        
        <form (ngSubmit)="createTimesheet()">
          <div class="space-y-6">
            <!-- Week Selection -->
            <div class="form-group">
              <label for="weekSelect" class="form-label required">Select Week</label>
              <select 
                id="weekSelect" 
                [(ngModel)]="selectedWeek" 
                name="weekSelect"
                class="form-control"
                required
              >
                <option [ngValue]="null" disabled>Select a week</option>
                <option *ngFor="let week of availableWeeks" [ngValue]="week">
                  {{ week.label }} 
                  <span *ngIf="week.remainingDays < 7" class="text-red-600">({{ week.remainingDays }} days left)</span>
                </option>
              </select>
              
              <!-- Grace period info -->
              <div *ngIf="selectedWeek" class="mt-2 text-sm" 
                [ngClass]="{'text-red-600': selectedWeek.remainingDays < 3, 'text-yellow-600': selectedWeek.remainingDays < 7, 'text-[var(--text-secondary)]': selectedWeek.remainingDays >= 7}">
                <span *ngIf="selectedWeek.remainingDays < 3" class="font-medium">Warning: </span>
                {{ selectedWeek.remainingDays }} days remaining to create this timesheet.
              </div>
            </div>
            
            <!-- Store Selection -->
            <div class="form-group">
              <label for="storeSelect" class="form-label required">Select Store</label>
              <select 
                id="storeSelect" 
                [(ngModel)]="selectedStoreId" 
                name="storeSelect"
                class="form-control"
                required
              >
                <option value="" disabled>Select a store</option>
                <option *ngFor="let store of stores" [value]="store._id">
                  {{ store.name }}
                </option>
              </select>
            </div>
            
            <!-- Completed Schedules Section -->
            <div *ngIf="completedSchedules.length > 0" class="border-t border-[var(--border-color)] pt-4">
              <h3 class="text-md font-medium mb-3">Completed Schedules Available</h3>
              
              <div class="space-y-3">
                <div *ngFor="let schedule of completedSchedules" class="p-3 border rounded-md bg-[var(--bg-main)]">
                  <div class="flex justify-between items-center">
                    <div>
                      <div class="font-medium">{{ schedule.title }}</div>
                      <div class="text-sm text-[var(--text-secondary)]">
                        {{ formatDate(schedule.week_start_date) }} - {{ formatDate(schedule.week_end_date) }}
                      </div>
                      <div class="text-sm mt-1">
                        <span class="font-medium">Store:</span> {{ schedule.store_name }}
                      </div>
                      <div class="text-sm">
                        <span class="font-medium">Shifts:</span> {{ schedule.shifts.length || 0 }}
                      </div>
                    </div>
                    
                    <button 
  type="button"
  (click)="createTimesheetFromSchedule(schedule._id || '')"
  class="btn btn-sm btn-primary"
>
  Use This Schedule
</button>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Form Actions -->
            <div class="pt-4 border-t border-[var(--border-color)] flex justify-end">
              <button 
                type="submit" 
                class="btn btn-primary"
                [disabled]="!selectedWeek || !selectedStoreId"
              >
                Create Timesheet
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PastTimesheetFormComponent implements OnInit {
  loading = true;
  error = '';
  
  // Form data
  availableWeeks: WeekOption[] = [];
  selectedWeek: WeekOption | null = null;
  selectedStoreId = '';
  
  // Reference data
  stores: Store[] = [];
  completedSchedules: Schedule[] = [];
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadAvailableWeeks();
    this.loadStores();
  }
  
  /**
   * Load available past weeks for timesheet creation
   */
  loadAvailableWeeks(): void {
    this.hoursService.getPastWeeksForTimesheets().subscribe({
      next: (weeks) => {
        this.availableWeeks = weeks;
        console.log(`Loaded ${weeks.length} available past weeks`);
        
        if (weeks.length > 0) {
          // Pre-select the first week
          this.selectedWeek = weeks[0];
          // Load completed schedules for this week
          this.loadCompletedSchedules();
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading available weeks:', err);
        this.error = 'Failed to load available weeks. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  /**
   * Load stores for selection
   */
  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        
        // Pre-select the first store if only one is available
        if (stores.length === 1) {
          this.selectedStoreId = stores[0]._id;
        }
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = 'Failed to load stores. Please try again later.';
      }
    });
  }
  
  /**
   * Load completed schedules for the selected week
   */
  loadCompletedSchedules(): void {
    if (!this.selectedWeek) return;
    
    const startDate = DateTimeUtils.formatDateForAPI(this.selectedWeek.startDate);
    const endDate = DateTimeUtils.formatDateForAPI(this.selectedWeek.endDate);
    
    this.hoursService.getCompletedSchedulesWithoutTimesheets(startDate, endDate).subscribe({
      next: (schedules) => {
        this.completedSchedules = schedules;
        console.log(`Loaded ${schedules.length} completed schedules for week of ${startDate}`);
        
        // If we found a completed schedule, pre-select its store
        if (schedules.length > 0 && !this.selectedStoreId) {
          this.selectedStoreId = schedules[0].store_id;
        }
      },
      error: (err) => {
        console.error('Error loading completed schedules:', err);
      }
    });
  }
  
  /**
   * Create a timesheet for the selected week and store
   */
  createTimesheet(): void {
    if (!this.selectedWeek || !this.selectedStoreId) {
      this.error = 'Please select both a week and a store';
      return;
    }
    
    this.loading = true;
    const startDate = DateTimeUtils.formatDateForAPI(this.selectedWeek.startDate);
    
    this.hoursService.startPastTimesheet(startDate, this.selectedStoreId).subscribe({
      next: (timesheet) => {
        console.log('Created past timesheet:', timesheet);
        // Navigate to the new timesheet
        this.router.navigate(['/timesheets', timesheet._id]);
      },
      error: (err) => {
        console.error('Error creating past timesheet:', err);
        this.error = 'Failed to create timesheet: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  /**
 * Create a timesheet from a completed schedule
 */
  createTimesheetFromSchedule(scheduleId: string | undefined): void {
  // Validate the schedule ID
  if (!scheduleId) {
    this.error = 'Cannot create timesheet: Invalid schedule ID';
    return;
  }
  
  this.loading = true;
  
  this.hoursService.createTimesheetFromSchedule(scheduleId).subscribe({
    next: (timesheet) => {
      console.log('Created timesheet from schedule:', timesheet);
      
      // Check for valid ID before navigating
      if (timesheet && timesheet._id) {
        // Navigate to the new timesheet
        this.router.navigate(['/timesheets', timesheet._id]);
      } else {
        this.error = 'Created timesheet has no ID';
        this.loading = false;
      }
    },
    error: (err) => {
      console.error('Error creating timesheet from schedule:', err);
      this.error = 'Failed to create timesheet: ' + (err.message || 'Unknown error');
      this.loading = false;
    }
  });
}
  
  navigateBack(): void {
    // Use window.history to go back if possible
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Otherwise navigate to the timesheet list
      this.router.navigate(['/timesheets']);
    }
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
}