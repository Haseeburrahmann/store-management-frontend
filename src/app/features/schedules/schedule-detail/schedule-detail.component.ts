// src/app/features/schedules/schedule-detail/schedule-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService, TimesheetQueryParams } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { EmployeeService } from '../../../core/services/employee.service';
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

interface EmployeeShiftResponse extends ScheduleShift {
  schedule_id?: string;
  schedule_title?: string;
  store_id?: string;
  store_name?: string;
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
      
      <!-- Week Navigation Controls -->
      <div class="flex gap-2">
        <button 
          (click)="navigateToPreviousWeek()" 
          class="btn btn-outline flex items-center"
          *ngIf="scheduleId"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Previous Week
        </button>
        
        <button 
          (click)="navigateToNextWeek()" 
          class="btn btn-outline flex items-center"
          *ngIf="scheduleId"
        >
          Next Week
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      
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
        <!-- Status Badge -->
        <div class="mt-2">
  <span [ngClass]="getStatusBadgeClass()">
    {{ getStatusLabel() }}
  </span>
  <span *ngIf="schedule?.status === 'completed' && schedule?.completed_at" class="text-sm text-[var(--text-secondary)] ml-2">
  Completed {{ formatDateWithTime(schedule.completed_at!) }}
</span>
</div>
      
      <div class="mt-4 md:mt-0 text-right">
        <div class="text-sm text-[var(--text-secondary)]">Created</div>
        <div>{{ formatDateWithTime(schedule.created_at) }}</div>
        
        <div class="mt-2">
          <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
            {{ getTotalShiftCount() }} Shifts
          </span>
        </div>
      </div>
    </div>

    <!-- Schedule Status Controls - NEW -->
    <div *ngIf="canManageSchedule()" class="mb-6 p-4 rounded border border-[var(--border-color)] bg-[var(--bg-main)]">
      <h3 class="text-lg font-medium mb-3">Schedule Status</h3>
      
      <div class="flex flex-wrap gap-4 items-center">
        <!-- Mark as Active Button -->
        <button 
          *ngIf="schedule.status !== 'active'"
          (click)="markScheduleAsActive()" 
          class="btn btn-sm btn-outline"
        >
          Mark as Active
        </button>
        
        <!-- Mark as Completed Button -->
        <button 
          *ngIf="schedule.status !== 'completed'"
          (click)="markScheduleAsCompleted()" 
          class="btn btn-sm btn-success"
        >
          Mark as Completed
        </button>
        
        <!-- Create Timesheet Button (only show when completed) -->
        <button 
          *ngIf="schedule.status === 'completed' && !hasExistingTimesheet"
          (click)="createTimesheetFromSchedule()" 
          class="btn btn-sm btn-primary"
        >
          Create Timesheet
        </button>
        
        <!-- Timesheet Already Exists Message -->
        <span 
          *ngIf="schedule.status === 'completed' && hasExistingTimesheet"
          class="text-sm text-[var(--text-secondary)]"
        >
          <span class="font-medium">Note:</span> A timesheet already exists for this schedule
        </span>
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
                <!-- Show appropriate message based on role -->
                {{ userRole === 'employee' ? 'No shifts scheduled for you' : 'No shifts scheduled' }}
              </div>
              
              <div *ngFor="let shift of day.shifts" class="mb-2 p-2 bg-[var(--bg-main)] rounded">
                <div class="flex justify-between">
                  <div class="font-medium">
                    <!-- Show proper employee name with (You) indicator -->
                    {{ shift.employee_name || (isCurrentEmployee(shift.employee_id) ? authService.currentUser?.full_name || 'Current Employee' : 'Unknown Employee') }}
                    <span *ngIf="isCurrentEmployee(shift.employee_id)" 
                        class="ml-1 text-xs text-green-600 dark:text-green-400">
                      (You)
                    </span>
                  </div>
                  <div>{{ formatShiftTime(shift.start_time) }} - {{ formatShiftTime(shift.end_time) }}</div>
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
  
  <!-- Empty Schedule Message -->
  <div *ngIf="!loading && schedule && schedule.shifts && schedule.shifts.length === 0" class="card mb-6">
    <div class="text-center py-8">
      <h2 class="text-xl font-medium mb-2">No Shifts Scheduled</h2>
      <p class="text-[var(--text-secondary)] mb-4">
        This schedule doesn't have any shifts yet.
      </p>
      <a 
        *appHasPermission="'hours:write'"
        [routerLink]="['/schedules', scheduleId, 'edit']" 
        class="btn btn-primary"
      >
        Add Shifts
      </a>
    </div>
  </div>
  
  <!-- Employee Schedule View -->
  <div *ngIf="!loading && schedule && employeeShifts.length > 0" class="card">
    <h2 class="text-lg font-semibold mb-4">
      {{ userRole === 'employee' ? 'Your Schedule Summary' : 'Employee Schedule Summary' }}
    </h2>
    
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
  
  <!-- No Schedule Found -->
  <div *ngIf="!loading && !schedule && !error" class="card">
    <div class="text-center py-8">
      <h2 class="text-xl font-medium mb-2">Schedule Not Found</h2>
      <p class="text-[var(--text-secondary)] mb-4">
        The requested schedule could not be found.
      </p>
      
      <a 
        routerLink="/schedules" 
        class="btn btn-primary"
      >
        View All Schedules
      </a>
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
  fullSchedule: Schedule | null = null; // Store the full schedule for admin view

  dailySchedules: DaySchedule[] = [];
  employeeShifts: { id: string, name: string, shifts: ScheduleShift[] }[] = [];

  // User info
  currentEmployeeId: string | null = null;
  userRole: 'admin' | 'manager' | 'employee' | 'unknown' = 'unknown';
  
  // Track if this schedule already has a timesheet
  hasExistingTimesheet = false;

  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    public authService: AuthService,
    private permissionService: PermissionService,
    private employeeService: EmployeeService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    // Determine user role
    this.userRole = this.permissionService.getRoleIdentifier();
  }

  ngOnInit(): void {
    this.scheduleId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.scheduleId) {
      this.error = 'No schedule ID provided';
      this.loading = false;
      return;
    }

    // Get the current user's ID and employee ID
    const currentUser = this.authService.currentUser;
    console.log(`Current logged in user: ${currentUser?.email}, ID: ${currentUser?._id}`);

    // For employees and managers, we need their employee ID for filtering
    this.hoursService.getCurrentEmployeeId().subscribe(employeeId => {
      this.currentEmployeeId = employeeId;
      console.log(`Employee ID for current user: ${this.currentEmployeeId}`);
      this.loadSchedule();
    });
  }

  /**
  * This function correctly handles the role-based visibility of schedules and shifts.
  * It ensures that admins see all shifts, while employees only see their own.
  */
  loadSchedule(): void {
    if (!this.scheduleId) {
      console.error('No schedule ID provided');
      this.error = 'Invalid schedule ID';
      this.loading = false;
      return;
    }

    console.log(`Loading schedule with ID: ${this.scheduleId}, for employee ID: ${this.currentEmployeeId}`);

    // Always load the full schedule
    this.hoursService.getSchedule(this.scheduleId).subscribe({
      next: (fullSchedule) => {
        console.log(`Got full schedule with ${fullSchedule.shifts?.length || 0} shifts`);

        // Store the full schedule - important for admin view
        this.fullSchedule = fullSchedule;

        // For employee role, filter the shifts to only show their own
        if (this.userRole === 'employee' && this.currentEmployeeId) {
          const employeeIdStr = String(this.currentEmployeeId);

          console.log(`Filtering shifts for employee ID: ${employeeIdStr}`);

          const matchingShifts = fullSchedule.shifts.filter(shift =>
            String(shift.employee_id) === employeeIdStr
          );

          console.log(`Found ${matchingShifts.length} matching shifts for employee`);

          if (matchingShifts.length > 0) {
            // Create a new schedule object with just this employee's shifts
            this.schedule = {
              ...fullSchedule,
              shifts: matchingShifts
            };
          } else {
            // If no matching shifts, still show the schedule but with empty shifts
            this.schedule = {
              ...fullSchedule,
              shifts: []
            };
          }
        } else {
          // For admin and manager, show the full schedule with all shifts
          this.schedule = fullSchedule;
        }

        this.organizeDailySchedules();
        this.organizeEmployeeShifts();
        
        // Check if a timesheet already exists for this schedule
        this.checkExistingTimesheet();
        
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error loading schedule ID=${this.scheduleId}:`, err);
        this.error = 'Failed to load schedule: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  /**
 * Check if a timesheet already exists for this schedule
 */
/**
 * Check if a timesheet already exists for this schedule
 */
checkExistingTimesheet(): void {
  if (!this.schedule || !this.schedule._id) return;
  
  // Create a properly typed parameter object
  const params: TimesheetQueryParams = {
    schedule_id: this.schedule._id
  };
  
  this.hoursService.getTimesheets(params).subscribe({
    next: (timesheets) => {
      this.hasExistingTimesheet = timesheets.length > 0;
      console.log(`Schedule ${this.schedule?._id} has existing timesheet: ${this.hasExistingTimesheet}`);
    },
    error: (err) => {
      console.error('Error checking for existing timesheets:', err);
    }
  });
}
  
  /**
   * Mark the current schedule as completed
   */
  markScheduleAsCompleted(): void {
    if (!this.schedule || !this.schedule._id) {
      this.error = 'Cannot complete: Invalid schedule';
      return;
    }
    
    this.loading = true;
    
    this.hoursService.markScheduleAsCompleted(this.schedule._id).subscribe({
      next: (updatedSchedule) => {
        this.schedule = updatedSchedule;
        this.fullSchedule = updatedSchedule;
        this.loading = false;
        console.log('Schedule marked as completed:', updatedSchedule);
      },
      error: (err) => {
        console.error('Error marking schedule as completed:', err);
        this.error = 'Failed to complete schedule: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  /**
   * Mark the current schedule as active (in progress)
   */
  markScheduleAsActive(): void {
    if (!this.schedule || !this.schedule._id) {
      this.error = 'Cannot update: Invalid schedule';
      return;
    }
    
    this.loading = true;
    
    this.hoursService.markScheduleAsActive(this.schedule._id).subscribe({
      next: (updatedSchedule) => {
        this.schedule = updatedSchedule;
        this.fullSchedule = updatedSchedule;
        this.loading = false;
        console.log('Schedule marked as active:', updatedSchedule);
      },
      error: (err) => {
        console.error('Error marking schedule as active:', err);
        this.error = 'Failed to update schedule: ' + err.message;
        this.loading = false;
      }
    });
  }
  
  /**
   * Create a timesheet from this completed schedule
   */
  /**
 * Create a timesheet from this completed schedule
 */
createTimesheetFromSchedule(): void {
  if (!this.schedule || !this.schedule._id) {
    this.error = 'Cannot create timesheet: Invalid schedule';
    return;
  }
  
  if (this.schedule.status !== 'completed') {
    this.error = 'Schedule must be marked as completed before creating a timesheet';
    return;
  }
  
  this.loading = true;
  
  // Safely pass the schedule ID
  this.hoursService.createTimesheetFromSchedule(this.schedule._id).subscribe({
    next: (timesheet) => {
      this.loading = false;
      console.log('Timesheet created from schedule:', timesheet);
      
      // Navigate to the new timesheet if it has an ID
      if (timesheet._id) {
        this.router.navigate(['/timesheets', timesheet._id]);
      } else {
        // Handle case where timesheet doesn't have an ID (shouldn't happen)
        this.error = 'Created timesheet has no ID';
      }
    },
    error: (err) => {
      console.error('Error creating timesheet from schedule:', err);
      this.error = 'Failed to create timesheet: ' + err.message;
      this.loading = false;
    }
  });
}

  /**
   * Navigate to previous week's schedule
   */
  navigateToPreviousWeek(): void {
    if (!this.schedule || !this.schedule.week_start_date) return;

    const currentWeekStart = new Date(this.schedule.week_start_date);
    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);

    this.findAndNavigateToWeek(previousWeekStart);
  }

  /**
   * Navigate to next week's schedule
   */
  navigateToNextWeek(): void {
    if (!this.schedule || !this.schedule.week_start_date) return;

    const currentWeekStart = new Date(this.schedule.week_start_date);
    const nextWeekStart = new Date(currentWeekStart);
    nextWeekStart.setDate(currentWeekStart.getDate() + 7);

    this.findAndNavigateToWeek(nextWeekStart);
  }

  /**
   * Find a schedule for a specific week and navigate to it
   */
  findAndNavigateToWeek(weekStart: Date): void {
    // Format date for API
    const startDate = DateTimeUtils.formatDateForAPI(weekStart);
    const endDate = DateTimeUtils.formatDateForAPI(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000));

    this.loading = true;

    // Check if a schedule exists for the target week
    this.hoursService.getSchedules({
      start_date: startDate,
      end_date: endDate,
      store_id: this.schedule?.store_id,
      limit: 1
    }).subscribe({
      next: (schedules) => {
        if (schedules.length > 0) {
          // Navigate to the found schedule
          this.router.navigate(['/schedules', schedules[0]._id]);
        } else {
          this.loading = false;
          alert(`No schedule found for the week of ${startDate}`);
        }
      },
      error: (err) => {
        console.error('Error finding schedule for week:', err);
        this.loading = false;
        alert('Error finding schedule: ' + err.message);
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
      // Admin sees all shifts, employee sees filtered shifts
      const dayShifts = this.getVisibleShifts().filter(shift =>
        shift.day_of_week.toLowerCase() === day
      );

      this.dailySchedules.push({
        day,
        dayName,
        date: dayDate,
        shifts: dayShifts
      });
    }
  }

  /**
   * Organize employee shifts to correctly display data for both admin and employee views
   */
  organizeEmployeeShifts(): void {
    if (!this.schedule) return;

    // For admin view, use the full schedule shifts to ensure all employees are shown
    const shiftsToOrganize = this.userRole === 'admin' || this.userRole === 'manager' ?
      (this.fullSchedule?.shifts || []) : this.getVisibleShifts();

    // Group shifts by employee
    const employeeMap = new Map<string, {
      id: string,
      name: string,
      shifts: ScheduleShift[]
    }>();

    // Process shifts and group by employee
    shiftsToOrganize.forEach(shift => {
      if (!shift.employee_id) return; // Skip shifts without employee ID

      const employeeId = String(shift.employee_id);

      if (!employeeMap.has(employeeId)) {
        // Get employee name from shift or use default
        let employeeName = shift.employee_name || 'Unknown Employee';

        // If this is the current employee, try to get name from auth service
        if (this.isCurrentEmployee(employeeId)) {
          const currentUser = this.authService.currentUser;
          if (currentUser && (currentUser.full_name || currentUser.email)) {
            employeeName = currentUser.full_name || currentUser.email;
          }
        }

        // Initialize employee entry in the map
        employeeMap.set(employeeId, {
          id: employeeId,
          name: employeeName,
          shifts: []
        });
      }

      // Add shift to the employee's shifts array
      const employeeEntry = employeeMap.get(employeeId);
      if (employeeEntry) {
        employeeEntry.shifts.push(shift);
      }
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

  /**
   * Get the total shift count properly for both admin and employee views
   */
  getTotalShiftCount(): number {
    if (this.userRole === 'admin' || this.userRole === 'manager') {
      // Admin and manager should see count of all shifts
      return this.fullSchedule?.shifts?.length || 0;
    } else {
      // Employees see only their visible shifts count
      return this.getVisibleShifts().length || 0;
    }
  }
  
  /**
   * Check if the current user has permission to manage the schedule status
   */
  canManageSchedule(): boolean {
    if (this.userRole === 'admin') {
      // Admins can always manage schedules
      return true;
    }
    
    if (this.userRole === 'manager' && this.schedule) {
      // Managers can only manage schedules for their assigned stores
      const currentUser = this.authService.currentUser;
      const store = this.schedule.store_id;
      
      // This is a simplified check - ideally there would be a proper check for store assignment
      return this.permissionService.hasPermission('hours:approve');
    }
    
    // Employees can't manage schedules
    return false;
  }
  
  /**
   * Get appropriate CSS classes for the status badge
   */
  getStatusBadgeClass(): string {
    if (!this.schedule) return '';
    
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium';
    
    switch (this.schedule.status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
      case 'active':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
      case 'pending':
      default:
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200`;
    }
  }
  
  /**
   * Get a human-readable label for the schedule status
   */
  /**
 * Get a human-readable label for the schedule status
 */
getStatusLabel(): string {
  if (!this.schedule || !this.schedule.status) return 'Pending';
  
  switch (this.schedule.status) {
    case 'completed':
      return 'Completed';
    case 'active':
      return 'In Progress';
    case 'pending':
    default:
      return 'Pending';
  }
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

  /**
   * Returns shifts based on user role - Enhanced for Admin View
   */
  getVisibleShifts(): ScheduleShift[] {
    if (!this.schedule || !this.schedule.shifts || !Array.isArray(this.schedule.shifts)) {
      return [];
    }

    console.log(`Filtering shifts for role: ${this.userRole}, schedule has ${this.schedule.shifts.length} total shifts`);

    // For admins and managers, show all shifts
    if (this.userRole === 'admin' || this.userRole === 'manager') {
      console.log(`Admin/Manager: Showing all ${this.schedule.shifts.length} shifts`);
      return this.schedule.shifts;
    }

    // For employees, only show their own shifts
    if (this.userRole === 'employee' && this.currentEmployeeId) {
      const employeeIdStr = String(this.currentEmployeeId);
      console.log(`Employee: filtering shifts for employee ID: ${employeeIdStr}`);

      // Filter shifts by employee ID
      const filteredShifts = this.schedule.shifts.filter(shift => {
        if (!shift.employee_id) return false;

        // Convert both to strings to ensure proper comparison
        const shiftEmployeeId = String(shift.employee_id);
        return shiftEmployeeId === employeeIdStr;
      });

      console.log(`Employee view: Found ${filteredShifts.length} shifts out of ${this.schedule.shifts.length}`);
      return filteredShifts;
    }

    // Default case - return all shifts
    return this.schedule.shifts;
  }

  /**
  * Improved version that uses String comparison for employee IDs
  */
  isCurrentEmployee(employeeId: any): boolean {
    if (!this.currentEmployeeId || !employeeId) return false;

    const currentIdStr = String(this.currentEmployeeId);
    const shiftEmployeeIdStr = String(employeeId);

    return currentIdStr === shiftEmployeeIdStr;
  }
}