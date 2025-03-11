// src/app/features/schedules/schedule-detail/schedule-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { Schedule, ScheduleShift } from '../../../shared/models/hours.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { ErrorHandlingService } from '../../../core/utils/error-handling.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

interface DaySchedule {
  day: string;
  dayName: string;
  date: Date;
  shifts: ScheduleShift[];
}

@Component({
  selector: 'app-schedule-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Schedule Details</h1>
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
          
          <div *appHasPermission="'hours:write'" class="flex gap-2">
            <a 
              [routerLink]="['/schedules', scheduleId, 'edit']" 
              class="btn btn-primary"
            >
              Edit Schedule
            </a>
            <button 
              (click)="deleteSchedule()"
              class="btn btn-danger"
            >
              Delete
            </button>
          </div>
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
      
      <!-- Schedule Details -->
      <div *ngIf="!loading && schedule" class="card mb-6">
        <div class="flex flex-col md:flex-row justify-between mb-6">
          <div>
            <h2 class="text-xl font-semibold">{{ schedule.title }}</h2>
            <p class="text-[var(--text-secondary)]">
              {{ formatDate(schedule.week_start_date) }} to {{ formatDate(schedule.week_end_date) }}
            </p>
            <p class="mt-2">
              <span class="font-medium">Store:</span> {{ schedule.store_name }}
            </p>
          </div>
          
          <div class="mt-4 md:mt-0 text-right">
            <div class="text-sm text-[var(--text-secondary)]">Created</div>
            <div>{{ formatDateWithTime(schedule.created_at) }}</div>
            
            <div class="mt-2">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {{ schedule.shifts.length }} Shifts
              </span>
            </div>
          </div>
        </div>
        
        <!-- Weekly View -->
        <div class="overflow-x-auto">
          <table class="min-w-full border-collapse">
            <thead>
              <tr>
                <th class="py-3 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] text-left">Day</th>
                <th class="py-3 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] text-left">Date</th>
                <th class="py-3 px-4 bg-[var(--bg-main)] border border-[var(--border-color)] text-left">Shifts</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of dailySchedules">
                <td class="py-3 px-4 border border-[var(--border-color)] align-top font-medium">
                  {{ day.dayName }}
                </td>
                <td class="py-3 px-4 border border-[var(--border-color)] align-top">
                  {{ formatDayDate(day.date) }}
                </td>
                <td class="py-3 px-4 border border-[var(--border-color)] align-top">
                  <div *ngIf="day.shifts.length === 0" class="text-[var(--text-secondary)] italic">
                    No shifts scheduled
                  </div>
                  
                  <div *ngFor="let shift of day.shifts" class="mb-2 p-2 bg-[var(--bg-main)] rounded">
                    <div class="flex justify-between">
                      <div class="font-medium">{{ shift.employee_name }}</div>
                      <div class="text-[var(--text-secondary)]">
                        {{ formatShiftTime(shift.start_time) }} - {{ formatShiftTime(shift.end_time) }}
                      </div>
                    </div>
                    <div *ngIf="shift.notes" class="mt-1 text-sm text-[var(--text-secondary)] italic">
                      {{ shift.notes }}
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Print/Export Actions -->
        <div class="mt-6 flex justify-end space-x-4">
          <button 
            (click)="printSchedule()" 
            class="btn btn-outline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            Print Schedule
          </button>
        </div>
      </div>
      
      <!-- Employee Schedule View -->
      <div *ngIf="!loading && schedule && employeeShifts.length > 0" class="card">
        <h2 class="text-lg font-semibold mb-4">Employee Schedule Summary</h2>
        
        <div class="space-y-4">
          <div *ngFor="let employee of employeeShifts" class="border rounded-lg overflow-hidden">
            <div class="px-4 py-3 bg-[var(--bg-main)] border-b border-[var(--border-color)]">
              <h3 class="font-medium">{{ employee.name }}</h3>
            </div>
            
            <div class="p-4">
              <table class="min-w-full">
                <thead>
                  <tr>
                    <th class="text-left">Day</th>
                    <th class="text-left">Hours</th>
                    <th class="text-left">Schedule</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let shift of employee.shifts">
                    <td class="py-2">{{ getDayName(shift.day_of_week) }}</td>
                    <td class="py-2">{{ calculateShiftHours(shift) }} hrs</td>
                    <td class="py-2">{{ formatShiftTime(shift.start_time) }} - {{ formatShiftTime(shift.end_time) }}</td>
                  </tr>
                  <tr class="font-medium">
                    <td class="pt-3">Total</td>
                    <td class="pt-3" colspan="2">{{ calculateTotalHours(employee.shifts) }} hours</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ScheduleDetailComponent implements OnInit {
  loading = true;
  error = '';
  scheduleId = '';
  schedule: Schedule | null = null;
  
  dailySchedules: DaySchedule[] = [];
  employeeShifts: { id: string, name: string, shifts: ScheduleShift[] }[] = [];
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.scheduleId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.scheduleId) {
      this.error = 'No schedule ID provided';
      this.loading = false;
      return;
    }
    
    this.loadSchedule();
  }
  
  loadSchedule(): void {
    this.hoursService.getSchedule(this.scheduleId).subscribe({
      next: (schedule) => {
        this.schedule = schedule;
        this.organizeDailySchedules();
        this.organizeEmployeeShifts();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading schedule:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  organizeDailySchedules(): void {
    if (!this.schedule) return;
    
    // Get week start date
    const startDate = new Date(this.schedule.week_start_date);
    
    // Create an array of days for the week
    this.dailySchedules = [];
    
    // Days of the week
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Create daily schedule objects
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + i);
      
      const day = days[i];
      const dayName = this.getDayName(day);
      
      // Get shifts for this day
      const shifts = this.schedule.shifts.filter(shift => 
        shift.day_of_week.toLowerCase() === day
      );
      
      this.dailySchedules.push({
        day,
        dayName,
        date: dayDate,
        shifts
      });
    }
  }
  
  organizeEmployeeShifts(): void {
    if (!this.schedule) return;
    
    // Group shifts by employee
    const employeeMap = new Map<string, { 
      id: string, 
      name: string, 
      shifts: ScheduleShift[] 
    }>();
    
    this.schedule.shifts.forEach(shift => {
      if (!employeeMap.has(shift.employee_id)) {
        employeeMap.set(shift.employee_id, {
          id: shift.employee_id,
          name: shift.employee_name || 'Unknown Employee',
          shifts: []
        });
      }
      
      employeeMap.get(shift.employee_id)?.shifts.push(shift);
    });
    
    // Convert map to array and sort by employee name
    this.employeeShifts = Array.from(employeeMap.values())
      .sort((a, b) => a.name.localeCompare(b.name));
  }
  
  deleteSchedule(): void {
    if (!this.scheduleId || !confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }
    
    this.loading = true;
    
    this.hoursService.deleteSchedule(this.scheduleId).subscribe({
      next: (result) => {
        if (result) {
          this.router.navigate(['/schedules']);
        } else {
          this.error = 'Failed to delete schedule';
          this.loading = false;
        }
      },
      error: (err) => {
        console.error('Error deleting schedule:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  printSchedule(): void {
    window.print();
  }
  
  navigateBack(): void {
    // Use window.history to go back if possible
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Otherwise navigate to the schedule list
      this.router.navigate(['/schedules']);
    }
  }
  
  calculateShiftHours(shift: ScheduleShift): number {
    const startMinutes = DateTimeUtils.timeToMinutes(shift.start_time);
    const endMinutes = DateTimeUtils.timeToMinutes(shift.end_time);
    
    // Handle overnight shifts
    let duration = endMinutes - startMinutes;
    if (duration < 0) {
      duration += 24 * 60; // Add 24 hours in minutes
    }
    
    return Math.round(duration / 60 * 10) / 10; // Round to 1 decimal place
  }
  
  calculateTotalHours(shifts: ScheduleShift[]): number {
    return shifts.reduce((total, shift) => total + this.calculateShiftHours(shift), 0);
  }
  
  // Helper methods
  getDayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  formatDayDate(date: Date): string {
    return DateTimeUtils.formatDateForDisplay(date.toISOString());
  }
  
  formatDateWithTime(dateStr?: string): string {
    if (!dateStr) return '';
    return DateTimeUtils.formatDateForDisplay(dateStr, { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  
  formatShiftTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
}