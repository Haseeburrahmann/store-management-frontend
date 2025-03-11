// src/app/features/schedules/schedule-form/schedule-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Schedule, ScheduleShift } from '../../../shared/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { Employee } from '../../../shared/models/employee.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { ErrorHandlingService } from '../../../core/utils/error-handling.service';
import { v4 as uuidv4 } from 'uuid';

interface ShiftFormData {
  id: string;
  day: string;
  employee_id: string;
  start_time: string;
  end_time: string;
  notes: string;
}

@Component({
  selector: 'app-schedule-form',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? 'Edit Schedule' : 'Create New Schedule' }}</h1>
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
      </div>
      
      <!-- Schedule Form -->
      <div *ngIf="!loading" class="card">
        <form (ngSubmit)="saveSchedule()">
          <div class="space-y-6">
            <!-- Basic Schedule Info -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-group">
                <label for="title" class="form-label required">Schedule Title</label>
                <input 
                  type="text" 
                  id="title" 
                  [(ngModel)]="schedule.title" 
                  name="title"
                  class="form-control"
                  required
                  placeholder="Weekly Schedule"
                >
              </div>
              
              <div class="form-group">
                <label for="storeId" class="form-label required">Store</label>
                <select 
                  id="storeId" 
                  [(ngModel)]="schedule.store_id" 
                  name="storeId"
                  class="form-control"
                  required
                >
                  <option value="" disabled>Select a store</option>
                  <option *ngFor="let store of stores" [value]="store._id">
                    {{ store.name }}
                  </option>
                </select>
              </div>
            </div>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-group">
                <label for="startDate" class="form-label required">Start Date</label>
                <input 
                  type="date" 
                  id="startDate" 
                  [(ngModel)]="schedule.week_start_date" 
                  name="startDate"
                  class="form-control"
                  required
                  (change)="updateEndDate()"
                >
                <div class="text-sm text-[var(--text-secondary)] mt-1">
                  Should be a Monday for best results
                </div>
              </div>
              
              <div class="form-group">
                <label for="endDate" class="form-label">End Date</label>
                <input 
                  type="date" 
                  id="endDate" 
                  [(ngModel)]="schedule.week_end_date" 
                  name="endDate"
                  class="form-control"
                  readonly
                >
                <div class="text-sm text-[var(--text-secondary)] mt-1">
                  Automatically set to Sunday (end of week)
                </div>
              </div>
            </div>
            
            <!-- Shifts Section -->
            <div>
              <h3 class="text-lg font-medium mb-4 pt-4 border-t border-[var(--border-color)]">Shifts</h3>
              
              <!-- Date tabs -->
              <div class="mb-4 border-b border-[var(--border-color)]">
                <div class="flex overflow-x-auto">
                  <button 
                    *ngFor="let day of weekDays" 
                    type="button"
                    [class.bg-[var(--bg-main)]]="selectedDay === day"
                    [class.border-b-2]="selectedDay === day"
                    [class.border-primary-500]="selectedDay === day"
                    [class.font-medium]="selectedDay === day"
                    class="px-4 py-2 whitespace-nowrap"
                    (click)="selectedDay = day"
                  >
                    {{ formatDayName(day) }}
                  </button>
                </div>
              </div>
              
              <!-- Shifts for selected day -->
              <div *ngIf="selectedDay">
                <h4 class="text-md font-medium mb-2">
                  {{ formatDayName(selectedDay) }} Shifts
                  <span class="text-sm font-normal text-[var(--text-secondary)] ml-2">
                    ({{ getDayShifts().length }} shifts)
                  </span>
                </h4>
                
                <div class="space-y-4 mb-4">
                  <div *ngFor="let shift of getDayShifts(); let i = index" class="border rounded-md p-4 bg-[var(--bg-main)]">
                    <div class="flex justify-between mb-2">
                      <h5 class="font-medium">Shift #{{ i + 1 }}</h5>
                      <button 
                        type="button" 
                        class="text-red-600 hover:text-red-800 dark:text-red-500 dark:hover:text-red-400"
                        (click)="removeShift(shift)"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div class="form-group md:col-span-2">
                        <label class="form-label required">Employee</label>
                        <select 
                          [(ngModel)]="shift.employee_id" 
                          [name]="'employee_' + shift.id"
                          class="form-control"
                          required
                        >
                          <option value="" disabled>Select an employee</option>
                          <option *ngFor="let employee of employees" [value]="employee._id">
                            {{ employee.full_name }}
                          </option>
                        </select>
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label required">Start Time</label>
                        <input 
                          type="time" 
                          [(ngModel)]="shift.start_time" 
                          [name]="'start_time_' + shift.id"
                          class="form-control"
                          required
                        >
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label required">End Time</label>
                        <input 
                          type="time" 
                          [(ngModel)]="shift.end_time" 
                          [name]="'end_time_' + shift.id"
                          class="form-control"
                          required
                        >
                      </div>
                    </div>
                    
                    <div class="form-group mt-2">
                      <label class="form-label">Notes</label>
                      <input 
                        type="text" 
                        [(ngModel)]="shift.notes" 
                        [name]="'notes_' + shift.id"
                        class="form-control"
                        placeholder="Optional notes about this shift"
                      >
                    </div>
                  </div>
                </div>
                
                <!-- Add shift button -->
                <button 
                  type="button" 
                  class="btn btn-outline w-full"
                  (click)="addShift()"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Shift for {{ formatDayName(selectedDay) }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-end space-x-4">
            <button 
              type="button" 
              class="btn btn-outline"
              (click)="navigateBack()"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="!isFormValid()"
            >
              {{ isEditMode ? 'Update Schedule' : 'Create Schedule' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class ScheduleFormComponent implements OnInit {
  loading = true;
  error = '';
  isEditMode = false;
  scheduleId = '';
  
  // Form data
  schedule: Partial<Schedule> = {
    title: '',
    store_id: '',
    week_start_date: '',
    week_end_date: '',
    shifts: [],
    created_by: ''
  };
  
  shifts: ShiftFormData[] = [];
  
  // Reference data
  stores: Store[] = [];
  employees: Employee[] = [];
  
  // UI state
  weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  selectedDay = 'monday';
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    // Check if we're in edit mode
    this.isEditMode = this.route.snapshot.data['isEdit'] || false;
    
    if (this.isEditMode) {
      this.scheduleId = this.route.snapshot.paramMap.get('id') || '';
      if (!this.scheduleId) {
        this.error = 'No schedule ID provided for editing';
        this.loading = false;
        return;
      }
    }
    
    // Set default dates if creating a new schedule
    if (!this.isEditMode) {
      this.setDefaultDates();
      
      // Set the current user as the creator
      const currentUser = this.authService.currentUser;
      if (currentUser) {
        this.schedule.created_by = currentUser._id;
      }
    }
    
    // Load reference data
    this.loadStores();
    this.loadEmployees();
    
    // If in edit mode, load the schedule data
    if (this.isEditMode && this.scheduleId) {
      this.loadSchedule();
    } else {
      this.loading = false;
    }
  }
  
  setDefaultDates(): void {
    // Set start date to next Monday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate days until next Monday (if today is Monday, use today)
    const daysUntilMonday = dayOfWeek === 1 ? 0 : (8 - dayOfWeek) % 7;
    
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    
    // Set end date to Sunday (6 days after Monday)
    const nextSunday = new Date(nextMonday);
    nextSunday.setDate(nextMonday.getDate() + 6);
    
    // Format dates for input
    this.schedule.week_start_date = nextMonday.toISOString().split('T')[0];
    this.schedule.week_end_date = nextSunday.toISOString().split('T')[0];
  }
  
  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
      }
    });
  }
  
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
      }
    });
  }
  
  loadSchedule(): void {
    this.hoursService.getSchedule(this.scheduleId).subscribe({
      next: (schedule) => {
        this.schedule = { ...schedule };
        
        // Convert shifts to form data format
        this.shifts = schedule.shifts.map(shift => ({
          id: shift._id || uuidv4(),
          day: shift.day_of_week,
          employee_id: shift.employee_id,
          start_time: shift.start_time,
          end_time: shift.end_time,
          notes: shift.notes || ''
        }));
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading schedule:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  updateEndDate(): void {
    if (!this.schedule.week_start_date) return;
    
    // Set end date to 6 days after start date
    const startDate = new Date(this.schedule.week_start_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    // Format date for input
    this.schedule.week_end_date = endDate.toISOString().split('T')[0];
  }
  
  getDayShifts(): ShiftFormData[] {
    return this.shifts.filter(shift => shift.day === this.selectedDay);
  }
  
  addShift(): void {
    // Create a new shift
    const newShift: ShiftFormData = {
      id: uuidv4(),
      day: this.selectedDay,
      employee_id: '',
      start_time: '09:00',  // Default start time
      end_time: '17:00',    // Default end time
      notes: ''
    };
    
    this.shifts.push(newShift);
  }
  
  removeShift(shift: ShiftFormData): void {
    this.shifts = this.shifts.filter(s => s.id !== shift.id);
  }
  
  isFormValid(): boolean {
    // Check required fields
    if (!this.schedule.title || !this.schedule.store_id || !this.schedule.week_start_date) {
      return false;
    }
    
    // Check if all shifts have required fields
    for (const shift of this.shifts) {
      if (!shift.employee_id || !shift.start_time || !shift.end_time) {
        return false;
      }
      
      // Validate start time is before end time
      if (shift.start_time >= shift.end_time) {
        // Allow overnight shifts where end time is less than start time
        // This is a simplification - a real implementation would need more validation
        if (shift.start_time !== '23:00' || shift.end_time !== '00:00') {
          return false;
        }
      }
    }
    
    return true;
  }
  
  saveSchedule(): void {
    if (!this.isFormValid()) {
      this.error = 'Please fill out all required fields';
      return;
    }
    
    this.loading = true;
    
    // Convert form shifts to model shifts
    const scheduleShifts = this.shifts.map(shift => ({
      employee_id: shift.employee_id,
      day_of_week: shift.day,
      start_time: shift.start_time,
      end_time: shift.end_time,
      notes: shift.notes
    }));
    
    // Update schedule with shifts
    const scheduleData: Partial<Schedule> = {
      ...this.schedule,
      shifts: scheduleShifts
    };
    
    if (this.isEditMode) {
      // Update existing schedule
      this.hoursService.updateSchedule(this.scheduleId, scheduleData).subscribe({
        next: (updatedSchedule) => {
          this.navigateToScheduleList();
        },
        error: (err) => {
          console.error('Error updating schedule:', err);
          this.error = ErrorHandlingService.getErrorMessage(err);
          this.loading = false;
        }
      });
    } else {
      // Create new schedule
      this.hoursService.createSchedule(scheduleData).subscribe({
        next: (newSchedule) => {
          this.navigateToScheduleList();
        },
        error: (err) => {
          console.error('Error creating schedule:', err);
          this.error = ErrorHandlingService.getErrorMessage(err);
          this.loading = false;
        }
      });
    }
  }
  
  navigateBack(): void {
    // Use window.history to go back if possible
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Otherwise navigate to the schedule list
      this.navigateToScheduleList();
    }
  }
  
  navigateToScheduleList(): void {
    this.router.navigate(['/schedules']);
  }
  
  // Helper methods
  formatDayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
}