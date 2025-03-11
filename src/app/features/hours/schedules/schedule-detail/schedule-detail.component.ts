// src/app/features/hours/schedules/schedule-detail/schedule-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HoursService } from '../../../../core/services/hours.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Schedule, ScheduleShift } from '../../../../shared/models/hours.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

interface DaySchedule {
  date: string;
  formattedDate: string;
  weekday: string;
  shifts: ScheduleShift[];
}

@Component({
  selector: 'app-schedule-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Schedule Details</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/hours/schedules" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Schedules
          </button>
          
          <div *appHasPermission="'hours:write'" class="flex gap-2">
            <a 
              [routerLink]="['/hours/schedules', scheduleId, 'edit']" 
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
      <div *ngIf="error" class="alert alert-danger">
        {{ error }}
      </div>
      
      <!-- Schedule Details -->
      <div *ngIf="schedule && !loading" class="space-y-6">
        <!-- Schedule Info Card -->
        <div class="card">
          <div class="flex flex-col md:flex-row md:justify-between">
            <div>
              <h2 class="text-xl font-semibold">{{ schedule.title }}</h2>
              <p class="text-[var(--text-secondary)]">
                {{ formatDateRange(schedule.start_date, schedule.end_date) }}
              </p>
            </div>
            <div class="mt-4 md:mt-0">
              <div class="flex items-center text-[var(--text-secondary)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {{ schedule.store_name }}
              </div>
              <div class="text-sm text-[var(--text-secondary)] mt-1">
                Total Shifts: {{ schedule.shifts.length || 0 }}
              </div>
            </div>
          </div>
        </div>
        
        <!-- Daily Schedule Cards -->
        <div class="space-y-4">
          <div *ngFor="let day of dailySchedules" class="card">
            <div class="border-b border-[var(--border-color)] mb-4 pb-2">
              <h3 class="text-lg font-medium">{{ day.formattedDate }}</h3>
              <p class="text-sm text-[var(--text-secondary)]">{{ day.shifts.length }} shifts</p>
            </div>
            
            <div *ngIf="day.shifts.length === 0" class="text-center py-4 text-[var(--text-secondary)]">
              No shifts scheduled for this day.
            </div>
            
            <div *ngIf="day.shifts.length > 0" class="divide-y divide-[var(--border-color)]">
              <div *ngFor="let shift of day.shifts" class="py-4 flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <div class="font-medium">{{ shift.employee_name }}</div>
                  <div class="text-sm text-[var(--text-secondary)]">
                    {{ formatTimeRange(shift.start_time, shift.end_time) }} ({{ calculateShiftDuration(shift) }})
                  </div>
                </div>
                
                <div *ngIf="shift.notes" class="mt-2 md:mt-0 md:ml-4 text-sm italic text-[var(--text-secondary)]">
                  "{{ shift.notes }}"
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Print/Export Actions -->
        <div class="flex justify-end space-x-4">
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
    </div>
  `
})
export class ScheduleDetailComponent implements OnInit {
  loading = true;
  error = '';
  scheduleId = '';
  schedule: Schedule | null = null;
  dailySchedules: DaySchedule[] = [];
  
  constructor(
    private hoursService: HoursService,
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
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading schedule:', err);
        this.error = 'Failed to load schedule. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  organizeDailySchedules(): void {
    if (!this.schedule) return;
    
    const shifts = this.schedule.shifts || [];
    const dateMap = new Map<string, ScheduleShift[]>();
    
    // Group shifts by date
    shifts.forEach(shift => {
      const existingShifts = dateMap.get(shift.date) || [];
      dateMap.set(shift.date, [...existingShifts, shift]);
    });
    
    // Create daily schedule objects
    const dailySchedules: DaySchedule[] = [];
    
    // Convert the dateMap to an array of daily schedules, sorted by date
    Array.from(dateMap.entries())
      .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
      .forEach(([date, shifts]) => {
        const dateObj = new Date(date);
        const weekday = dateObj.toLocaleDateString(undefined, { weekday: 'long' });
        const formattedDate = dateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
        
        // Sort shifts by start time
        const sortedShifts = [...shifts].sort((a, b) => {
          return a.start_time.localeCompare(b.start_time);
        });
        
        dailySchedules.push({
          date,
          formattedDate,
          weekday,
          shifts: sortedShifts
        });
      });
    
    this.dailySchedules = dailySchedules;
  }
  
  deleteSchedule(): void {
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }
    
    this.loading = true;
    
    this.hoursService.deleteSchedule(this.scheduleId).subscribe({
      next: () => {
        this.router.navigate(['/hours/schedules']);
      },
      error: (err) => {
        console.error('Error deleting schedule:', err);
        this.error = 'Failed to delete schedule. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  printSchedule(): void {
    window.print();
  }
  
  formatDateRange(startDate: string, endDate: string): string {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    return `${start.toLocaleDateString(undefined, { month: 'long', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}`;
  }
  
  formatTimeRange(startTime: string, endTime: string): string {
    return `${this.format12HourTime(startTime)} - ${this.format12HourTime(endTime)}`;
  }
  
  calculateShiftDuration(shift: ScheduleShift): string {
    const [startHours, startMinutes] = shift.start_time.split(':').map(Number);
    const [endHours, endMinutes] = shift.end_time.split(':').map(Number);
    
    let durationMinutes = (endHours * 60 + endMinutes) - (startHours * 60 + startMinutes);
    
    // Handle overnight shifts
    if (durationMinutes < 0) {
      durationMinutes += 24 * 60;
    }
    
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    
    if (hours === 0) {
      return `${minutes} min`;
    } else if (minutes === 0) {
      return `${hours} hr`;
    } else {
      return `${hours} hr ${minutes} min`;
    }
  }
  
  format12HourTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}