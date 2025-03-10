// src/app/features/hours/schedules/schedule-form/schedule-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../../core/services/hours.service';
import { StoreService } from '../../../../core/services/store.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { Schedule, ScheduleShift } from '../../../../shared/models/hours.model';
import { Store } from '../../../../shared/models/store.model';
import { Employee } from '../../../../shared/models/employee.model';

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
                  [(ngModel)]="schedule.start_date" 
                  name="startDate"
                  class="form-control"
                  required
                  (change)="generateDateRange()"
                >
              </div>
              
              <div class="form-group">
                <label for="endDate" class="form-label required">End Date</label>
                <input 
                  type="date" 
                  id="endDate" 
                  [(ngModel)]="schedule.end_date" 
                  name="endDate"
                  class="form-control"
                  required
                  (change)="generateDateRange()"
                >
              </div>
            </div>
            
            <!-- Shifts Section -->
            <div>
              <h3 class="text-lg font-medium mb-4 pt-4 border-t border-[var(--border-color)]">Shifts</h3>
              
              <!-- Date tabs -->
              <div class="mb-4 border-b border-[var(--border-color)]">
                <div class="flex overflow-x-auto">
                  <button 
                    *ngFor="let date of dateRange" 
                    type="button"
                    [class.bg-[var(--bg-main)]]="selectedDate === date"
                    [class.border-b-2]="selectedDate === date"
                    [class.border-primary-500]="selectedDate === date"
                    [class.font-medium]="selectedDate === date"
                    class="px-4 py-2 whitespace-nowrap"
                    (click)="selectedDate = date"
                  >
                    {{ formatDateForTab(date) }}
                  </button>
                </div>
              </div>
              
              <!-- Shifts for selected date -->
              <div *ngIf="selectedDate">
                <h4 class="text-md font-medium mb-2">
                  {{ formatDate(selectedDate) }} Shifts
                  <span class="text-sm font-normal text-[var(--text-secondary)] ml-2">
                    ({{ getShiftsForDate(selectedDate).length }} shifts)
                  </span>
                </h4>
                
                <div class="space-y-4 mb-4">
                  <div *ngFor="let shift of getShiftsForDate(selectedDate); let i = index" class="border rounded-md p-4 bg-[var(--bg-main)]">
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
                          [name]="'employee_' + i"
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
                          [name]="'start_time_' + i"
                          class="form-control"
                          required
                        >
                      </div>
                      
                      <div class="form-group">
                        <label class="form-label required">End Time</label>
                        <input 
                          type="time" 
                          [(ngModel)]="shift.end_time" 
                          [name]="'end_time_' + i"
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
                        [name]="'notes_' + i"
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
                  (click)="addShift(selectedDate)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Add Shift for {{ formatDate(selectedDate) }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Form Actions -->
          <div class="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-end space-x-4">
            <button 
              type="button" 
              class="btn btn-outline"
              (click)="goBack()"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="!schedule.store_id || !schedule.title || !schedule.start_date || !schedule.end_date"
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
  isEditMode = false;
  scheduleId = '';
  
  // Form data
  schedule: Schedule = {
    title: '',
    store_id: '',
    start_date: '',
    end_date: '',
    shifts: [],
    created_by: ''
  };
  
  // Reference data
  stores: Store[] = [];
  employees: Employee[] = [];
  
  // UI state
  dateRange: string[] = [];
  selectedDate = '';
  
  // Helper methods
  getShiftsForDate(date: string): ScheduleShift[] {
    return this.schedule.shifts.filter(shift => shift.date === date);
  }
  
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
  }
  
  formatDateForTab(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' });
  }
  
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
    }
    
    // Set default dates if creating a new schedule
    if (!this.isEditMode) {
      const today = new Date();
      const nextSunday = new Date(today);
      nextSunday.setDate(today.getDate() + (7 - today.getDay()) % 7);
      
      const nextSaturday = new Date(nextSunday);
      nextSaturday.setDate(nextSunday.getDate() + 6);
      
      this.schedule.start_date = nextSunday.toISOString().split('T')[0];
      this.schedule.end_date = nextSaturday.toISOString().split('T')[0];
      
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
      this.generateDateRange();
      this.loading = false;
    }
  }
  
  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        alert('Failed to load stores. Please try again later.');
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
        alert('Failed to load employees. Please try again later.');
      }
    });
  }
  
  loadSchedule(): void {
    this.hoursService.getSchedule(this.scheduleId).subscribe({
      next: (schedule) => {
        this.schedule = schedule;
        this.generateDateRange();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading schedule:', err);
        alert('Failed to load schedule. Please try again later.');
        this.loading = false;
      }
    });
  }
  
  generateDateRange(): void {
    if (!this.schedule.start_date || !this.schedule.end_date) {
      this.dateRange = [];
      return;
    }
    
    const start = new Date(this.schedule.start_date);
    const end = new Date(this.schedule.end_date);
    const range: string[] = [];
    
    let current = new Date(start);
    
    // Loop through each day between start and end dates
    while (current <= end) {
      range.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    this.dateRange = range;
    
    // Set the selected date to the first date if not already set
    if (!this.selectedDate || !this.dateRange.includes(this.selectedDate)) {
      this.selectedDate = this.dateRange[0] || '';
    }
  }
  
  addShift(date: string): void {
    // Create a new shift for the selected date
    const newShift: ScheduleShift = {
      employee_id: '',
      date: date,
      start_time: '09:00',  // Default start time
      end_time: '17:00',    // Default end time
    };
    
    this.schedule.shifts.push(newShift);
  }
  
  removeShift(shift: ScheduleShift): void {
    this.schedule.shifts = this.schedule.shifts.filter(s => s !== shift);
  }
  
  saveSchedule(): void {
    // Validate the schedule before saving
    if (!this.validateSchedule()) {
      return;
    }
    
    this.loading = true;
    
    if (this.isEditMode) {
      // Update existing schedule
      this.hoursService.updateSchedule(this.scheduleId, this.schedule).subscribe({
        next: (updatedSchedule) => {
          this.loading = false;
          this.navigateToScheduleList();
        },
        error: (err) => {
          console.error('Error updating schedule:', err);
          alert('Failed to update schedule. Please try again later.');
          this.loading = false;
        }
      });
    } else {
      // Create new schedule
      this.hoursService.createSchedule(this.schedule).subscribe({
        next: (newSchedule) => {
          this.loading = false;
          this.navigateToScheduleList();
        },
        error: (err) => {
          console.error('Error creating schedule:', err);
          alert('Failed to create schedule. Please try again later.');
          this.loading = false;
        }
      });
    }
  }
  
  validateSchedule(): boolean {
    // Basic validation
    if (!this.schedule.title) {
      alert('Please enter a schedule title');
      return false;
    }
    
    if (!this.schedule.store_id) {
      alert('Please select a store');
      return false;
    }
    
    if (!this.schedule.start_date || !this.schedule.end_date) {
      alert('Please select start and end dates');
      return false;
    }
    
    // Validate shifts
    for (const shift of this.schedule.shifts) {
      if (!shift.employee_id) {
        alert('Please select an employee for all shifts');
        return false;
      }
      
      if (!shift.start_time || !shift.end_time) {
        alert('Please enter start and end times for all shifts');
        return false;
      }
      
      // Validate that end time is after start time
      const [startHours, startMinutes] = shift.start_time.split(':').map(Number);
      const [endHours, endMinutes] = shift.end_time.split(':').map(Number);
      
      if (endHours < startHours || (endHours === startHours && endMinutes <= startMinutes)) {
        alert('End time must be after start time for all shifts');
        return false;
      }
    }
    
    return true;
  }
  
  goBack(): void {
    this.navigateToScheduleList();
  }
  
  navigateToScheduleList(): void {
    this.router.navigate(['/hours/schedules']);
  }
}