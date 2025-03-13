// src/app/features/schedules/schedule-list/schedule-list.component.ts
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Schedule, ScheduleShift } from '../../../shared/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Schedules</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <a 
            *appHasPermission="'hours:write'"
            routerLink="/schedules/new" 
            class="btn btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Schedule
          </a>
        </div>
      </div>
      
      <!-- Filter Controls -->
      <div class="card mb-6">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="form-group" *ngIf="showStoreFilter">
            <label for="storeFilter" class="form-label">Store</label>
            <select 
              id="storeFilter" 
              [(ngModel)]="storeFilter" 
              (change)="loadSchedules()"
              class="form-control"
            >
              <option value="">All Stores</option>
              <option *ngFor="let store of stores" [value]="store._id">
                {{ store.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="startDate" class="form-label">Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              [(ngModel)]="startDate" 
              (change)="loadSchedules()"
              class="form-control"
            >
          </div>
          
          <div class="form-group">
            <label for="endDate" class="form-label">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              [(ngModel)]="endDate" 
              (change)="loadSchedules()"
              class="form-control"
            >
          </div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div *ngIf="loading" class="flex justify-center my-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Week Navigation - NEW FEATURE -->
      <div *ngIf="!loading && currentWeekSchedule" class="card mb-6">
        <h2 class="text-lg font-semibold mb-4">Current Week Schedule</h2>
        
        <!-- Week Navigation Controls -->
        <div class="flex justify-between items-center mb-4">
          <button 
            (click)="navigateToPreviousWeek()" 
            class="btn btn-sm btn-outline flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Previous Week
          </button>
          
          <div class="text-center">
            <div class="font-medium">{{ formatDate(currentWeekSchedule.week_start_date) }} - {{ formatDate(currentWeekSchedule.week_end_date) }}</div>
            <div *ngIf="isCurrentWeek" class="text-xs text-[var(--text-secondary)]">(Current Week)</div>
          </div>
          
          <button 
            (click)="navigateToNextWeek()" 
            class="btn btn-sm btn-outline flex items-center"
          >
            Next Week
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        
        <div class="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <div class="text-sm text-[var(--text-secondary)]">Store</div>
            <div>{{ currentWeekSchedule.store_name }}</div>
          </div>
          <div>
            <div class="text-sm text-[var(--text-secondary)]">Shifts</div>
            <div>{{  getShiftCount(currentWeekSchedule) }}</div>
          </div>
        </div>
        
        <div class="flex justify-end">
          <a 
            [routerLink]="['/schedules', currentWeekSchedule._id]" 
            class="btn btn-primary"
          >
            View Schedule
          </a>
        </div>
      </div>
      
      <!-- No Current Schedule Message -->
      <div *ngIf="!loading && !currentWeekSchedule && !isLoadingWeek" class="alert alert-info mb-6">
  No schedule found for the selected week. 
  <a *appHasPermission="'hours:write'" routerLink="/schedules/new" class="font-medium underline">Create a new schedule?</a>
</div>
      
      <!-- Schedules List -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">All Schedules</h2>
        
        <!-- Empty state -->
        <div *ngIf="!loading && (!schedules || schedules.length === 0)" class="text-center py-6 text-[var(--text-secondary)]">
          No schedules found matching your filters.
        </div>
        
        <!-- Schedules list -->
        <div *ngIf="!loading && schedules && schedules.length > 0" class="space-y-4">
          <div *ngFor="let schedule of schedules; trackBy: trackByScheduleId" class="border rounded-lg overflow-hidden bg-[var(--bg-card)]">
            <div class="border-b border-[var(--border-color)] px-6 py-4 flex justify-between items-center">
              <div>
                <h3 class="font-medium">{{ schedule.title }}</h3>
                <p class="text-sm text-[var(--text-secondary)]">
                  {{ formatDate(schedule.week_start_date) }} - {{ formatDate(schedule.week_end_date) }}
                </p>
              </div>
              <div class="text-right">
                <div class="text-sm text-[var(--text-secondary)]">Shifts</div>
                <div class="font-medium">{{ getVisibleShifts(schedule).length || 0 }}</div>
              </div>
            </div>
            
            <div class="px-6 py-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div class="text-sm text-[var(--text-secondary)]">Store</div>
                  <div>{{ schedule.store_name }}</div>
                </div>
                <div>
                  <div class="text-sm text-[var(--text-secondary)]">Created</div>
                  <div>{{ formatDateWithTime(schedule.created_at) }}</div>
                </div>
              </div>
              
              <!-- Preview of shifts (first few) -->
              <div *ngIf="getVisibleShifts(schedule).length > 0" class="mt-4">
                <div class="text-sm font-medium mb-2">Shift Preview:</div>
                <div class="space-y-1">
                  <div *ngFor="let shift of getPreviewShifts(getVisibleShifts(schedule)); let i = index" class="text-sm">
                    <span class="text-[var(--text-primary)]">{{ getDayName(shift.day_of_week) }}:</span>
                    <span class="text-[var(--text-secondary)] ml-1">{{ shift.employee_name || 'Employee' }} ({{ formatShiftTime(shift.start_time) }} - {{ formatShiftTime(shift.end_time) }})</span>
                  </div>
                  <div *ngIf="getVisibleShifts(schedule).length > 3" class="text-sm text-[var(--text-secondary)] italic">
                    And {{ getVisibleShifts(schedule).length - 3 }} more shifts...
                  </div>
                </div>
              </div>
            </div>
            
            <div class="bg-[var(--bg-main)] px-6 py-3 border-t border-[var(--border-color)]">
              <div class="flex flex-col sm:flex-row sm:justify-end gap-2">
                <a 
                  [routerLink]="['/schedules', schedule._id]" 
                  class="btn btn-sm btn-outline"
                >
                  View Details
                </a>
                
                <a 
                  *appHasPermission="'hours:write'"
                  [routerLink]="['/schedules', schedule._id, 'edit']" 
                  class="btn btn-sm btn-outline"
                >
                  Edit
                </a>
                
                <button 
                  *appHasPermission="'hours:write'"
                  (click)="deleteSchedule(schedule._id || '')"
                  class="btn btn-sm btn-danger"
                  [disabled]="!schedule._id"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination controls -->
        <div *ngIf="!loading && schedules && schedules.length > 0" class="flex justify-between items-center mt-6">
          <div>
            <span class="text-sm text-[var(--text-secondary)]">
              Showing {{ schedules.length }} of {{ totalSchedules }} schedules
            </span>
          </div>
          
          <div class="flex space-x-2">
            <button 
              (click)="previousPage()" 
              class="btn btn-sm btn-outline"
              [disabled]="currentPage === 1"
            >
              Previous
            </button>
            <span class="flex items-center px-3">
              Page {{ currentPage }}
            </span>
            <button 
              (click)="nextPage()" 
              class="btn btn-sm btn-outline"
              [disabled]="schedules.length < pageSize"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ScheduleListComponent implements OnInit {
  loading = true;
  schedules: Schedule[] = [];
  currentWeekSchedule: Schedule | null = null;
  stores: Store[] = [];

  // Week navigation - NEW
  isCurrentWeek = true;
  selectedWeekStartDate: Date | null = null;
  isLoadingWeek = false;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalSchedules = 0;

  // Filters
  storeFilter = '';
  startDate = '';
  endDate = '';

  // User info
  currentEmployeeId: string | null = null;
  userRole: 'admin' | 'manager' | 'employee' | 'unknown' = 'unknown';
  showStoreFilter = true; // Default true, will be set based on role

  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private employeeService: EmployeeService,
    private changeDetector: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    this.setupDateRange();
    this.setupUserRole();
    this.loadStores();
    this.loadCurrentWeekSchedule();
  }

  setupUserRole(): void {
    // Determine user role
    this.userRole = this.permissionService.getRoleIdentifier();

    // For employees and managers, we need their employee ID for filtering
    if (this.userRole === 'employee' || this.userRole === 'manager') {
      this.showStoreFilter = this.userRole === 'manager';

      // Get employee ID for current user
      this.hoursService.getCurrentEmployeeId().subscribe(employeeId => {
        this.currentEmployeeId = employeeId;
        this.loadSchedules();
      });
    } else {
      // Admin can see all schedules
      this.loadSchedules();
    }
  }

  /**
   * Setup date range to ensure current week is included
   */
  setupDateRange(): void {
    // Default date range - set to current month but ensure it includes the current week
    const today = new Date();

    // Calculate the start of the current week (Monday)
    const currentWeekStart = this.getWeekStartDate(today);
    this.selectedWeekStartDate = new Date(currentWeekStart);

    // Calculate week end (Sunday)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);

    // Use either the 1st of the month or the start of the current week, whichever is earlier
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = firstDayOfMonth < currentWeekStart ? firstDayOfMonth : currentWeekStart;

    // End date should include at least the end of the current week (Sunday)
    // Use either the last day of the month or the end of the current week, whichever is later
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    const endDate = lastDayOfMonth > currentWeekEnd ? lastDayOfMonth : currentWeekEnd;

    // Format dates for API - use UTC format to avoid timezone issues
    this.startDate = DateTimeUtils.formatDateForAPI(startDate);
    this.endDate = DateTimeUtils.formatDateForAPI(endDate);

    console.log(`Date range set to: ${this.startDate} to ${this.endDate}`);
  }

  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
      },
      error: (err) => {
        console.error('Error loading stores:', err);
      }
    });
  }

  /**
  * Improved loadScheduleForWeek method with better handling for multi-store employees
  */
  loadScheduleForWeek(weekStartDate: Date): void {
    this.isLoadingWeek = true;

    const weekStart = this.getWeekStartDate(weekStartDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Check if this is the current week
    const currentWeekStart = this.getWeekStartDate(new Date());
    this.isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

    // Format dates for API
    const weekStartStr = DateTimeUtils.formatDateForAPI(weekStart);
    const weekEndStr = DateTimeUtils.formatDateForAPI(weekEnd);

    console.log(`Loading schedule for week: ${weekStartStr} to ${weekEndStr}`);

    // Make request without store filter to see schedules from all stores
    this.hoursService.getSchedules({
      start_date: weekStartStr,
      end_date: weekEndStr
    }).subscribe({
      next: (schedules) => {
        console.log(`Received ${schedules.length} schedules for week navigation`);

        if (schedules.length === 0) {
          console.log('No schedules found for the selected week');
          this.currentWeekSchedule = null;
        } else {
          if (this.userRole === 'employee' && this.currentEmployeeId) {
            // For employees, we need to combine shifts from multiple schedules
            const employeeIdStr = String(this.currentEmployeeId);
            let combinedShifts: string | any[] = [];
            let selectedSchedule = null;

            // Check each schedule for this employee's shifts
            for (const schedule of schedules) {
              if (Array.isArray(schedule.shifts)) {
                const employeeShifts = schedule.shifts.filter(shift =>
                  String(shift.employee_id) === employeeIdStr
                );

                if (employeeShifts.length > 0) {
                  console.log(`Found ${employeeShifts.length} shifts for employee in schedule: ${schedule.title}`);
                  combinedShifts = [...combinedShifts, ...employeeShifts];

                  // Use the first schedule that has shifts for this employee as the base
                  if (!selectedSchedule) {
                    selectedSchedule = schedule;
                  }
                }
              }
            }

            if (selectedSchedule && combinedShifts.length > 0) {
              // Create a combined schedule with all shifts for this employee
              this.currentWeekSchedule = {
                ...selectedSchedule,
                shifts: combinedShifts,
                store_name: combinedShifts.length > 0 ?
                  `${selectedSchedule.store_name} (and ${combinedShifts.length} shifts)` :
                  selectedSchedule.store_name
              };
              console.log(`Created combined schedule with ${combinedShifts.length} shifts for employee`);
            } else {
              // No shifts found for this employee
              console.log('No shifts found for this employee in any schedule');
              this.currentWeekSchedule = {
                ...schedules[0],
                shifts: []
              };
            }
          } else {
            // For admin/manager, just use the first schedule
            console.log(`Using first schedule: ${schedules[0].title} with ${schedules[0].shifts?.length || 0} shifts`);
            this.currentWeekSchedule = schedules[0];
          }
        }

        this.isLoadingWeek = false;
      },
      error: (err) => {
        console.error('Error loading week schedule:', err);
        this.currentWeekSchedule = null;
        this.isLoadingWeek = false;
      }
    });
  }

  /**
   * Navigate to previous week - NEW FEATURE
   */
  navigateToPreviousWeek(): void {
    if (this.selectedWeekStartDate) {
      const previousWeekStart = new Date(this.selectedWeekStartDate);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      this.selectedWeekStartDate = previousWeekStart;

      // Load schedule using the specialized employee/me endpoint
      this.loadEmployeeScheduleForWeek(previousWeekStart);
    }
  }

  /**
   * Navigate to next week - NEW FEATURE
   */
  navigateToNextWeek(): void {
    if (this.selectedWeekStartDate) {
      const nextWeekStart = new Date(this.selectedWeekStartDate);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      this.selectedWeekStartDate = nextWeekStart;

      // Load schedule using the specialized employee/me endpoint
      this.loadEmployeeScheduleForWeek(nextWeekStart);
    }
  }

  /**
   * Get start of week date (Monday) from any date
   */
  getWeekStartDate(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  /**
  * Enhanced loadSchedules method with improved error handling and role-based filtering
  */
  loadSchedules(): void {
    this.loading = true;

    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };

    // For managers, apply store filter if selected
    if (this.userRole === 'manager' && this.storeFilter) {
      options.store_id = this.storeFilter;
    }

    // Add date filters if provided
    if (this.startDate) {
      options.start_date = this.startDate;
      console.log(`Using start date filter: ${this.startDate}`);
    }

    if (this.endDate) {
      options.end_date = this.endDate;
      console.log(`Using end date filter: ${this.endDate}`);
    }

    console.log(`Loading schedules with filters:`, options);

    this.hoursService.getSchedules(options).subscribe({
      next: (schedules) => {
        console.log(`Received ${schedules.length} schedules from API`);

        this.schedules = this.fixScheduleData(schedules);
        // Ensure all schedules have shifts array initialized
        schedules.forEach(schedule => {
          if (!Array.isArray(schedule.shifts)) {
            schedule.shifts = [];
          }
        });

        // For employees, filter schedules to only show those with their shifts
        if (this.userRole === 'employee' && this.currentEmployeeId) {
          const employeeIdStr = String(this.currentEmployeeId);
          console.log(`Filtering schedules for employee ID: ${employeeIdStr}`);

          let employeeSchedules = schedules.filter(schedule => {
            // Make sure shifts is an array and check if any shift belongs to this employee
            const hasEmployeeShift = Array.isArray(schedule.shifts) &&
              schedule.shifts.some(shift =>
                shift && shift.employee_id && String(shift.employee_id) === employeeIdStr
              );

            if (hasEmployeeShift) {
              console.log(`Schedule ${schedule.title} has shifts for employee ${employeeIdStr}`);

              // Create a copy with only this employee's shifts
              schedule.shifts = schedule.shifts.filter(shift =>
                String(shift.employee_id) === employeeIdStr
              );
            }

            return hasEmployeeShift;
          });

          console.log(`Found ${employeeSchedules.length} schedules with employee shifts`);

          // Include current week schedule if it has shifts for this employee
          if (this.currentWeekSchedule && this.currentWeekSchedule._id) {
            const currentScheduleExists = employeeSchedules.some(s => s._id === this.currentWeekSchedule?._id);

            if (!currentScheduleExists && this.currentWeekSchedule.shifts.length > 0) {
              console.log('Adding current week schedule to results');
              employeeSchedules = [this.currentWeekSchedule, ...employeeSchedules];
            }
          }

          this.schedules = employeeSchedules;
        } else {
          // Admin and managers see all schedules
          this.schedules = schedules;
        }

        // Fetch store names for schedules if needed
        this.enhanceSchedulesWithStoreNames();

        this.updatePagination();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading schedules:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Add store names to schedules that don't have them
   */
  enhanceSchedulesWithStoreNames(): void {
    const storePromises: Promise<void>[] = [];

    this.schedules.forEach(schedule => {
      if (!schedule.store_name && schedule.store_id) {
        const promise = new Promise<void>((resolve) => {
          this.storeService.getStoreById(schedule.store_id).subscribe({
            next: (store) => {
              schedule.store_name = store.name;
              resolve();
            },
            error: () => {
              schedule.store_name = 'Unknown Store';
              resolve();
            }
          });
        });
        storePromises.push(promise);
      }
    });

    // Wait for all store lookups to complete
    Promise.all(storePromises);
  }

  /**
   * Enhance schedule data with missing information
   */
  enhanceSchedulesData(): void {
    const storePromises: Promise<void>[] = [];

    this.schedules.forEach(schedule => {
      // Ensure shifts array exists
      if (!schedule.shifts || !Array.isArray(schedule.shifts)) {
        schedule.shifts = [];
      }

      // If store name is missing but we have store_id, fetch store details
      if (!schedule.store_name && schedule.store_id) {
        const promise = new Promise<void>((resolve) => {
          this.storeService.getStoreById(schedule.store_id).subscribe({
            next: (store) => {
              schedule.store_name = store.name;
              resolve();
            },
            error: () => {
              schedule.store_name = 'Unknown Store';
              resolve();
            }
          });
        });
        storePromises.push(promise);
      }
    });

    // Wait for all store lookups to complete
    Promise.all(storePromises);
  }

  /**
 * Improved loadCurrentSchedule method with proper week date handling
 */
  loadCurrentWeekSchedule(): void {
    console.log('Loading current schedule with improved handling');

    // Use the updated version appropriate for the user's role
    if (this.userRole === 'employee') {
      // For employees, use the employee-specific endpoint
      this.hoursService.getMyScheduleShifts().subscribe({
        next: (shifts) => {
          const hasShifts = shifts && shifts.length > 0;

          if (hasShifts) {
            // Extract common schedule data from the first shift
            const firstShift = shifts[0];
            const scheduleId = firstShift.schedule_id || '';
            const storeId = firstShift.store_id || '';
            const storeName = firstShift.store_name || '';
            const scheduleTitle = firstShift.schedule_title || 'Weekly Schedule';

            // Calculate week dates based on the day of the first shift
            const today = new Date();
            const weekStart = this.getWeekStartDate(today);
            const weekEnd = new Date(weekStart);
            weekEnd.setDate(weekStart.getDate() + 6);

            // Build a Schedule object from the shifts
            this.currentWeekSchedule = {
              _id: scheduleId,
              title: scheduleTitle,
              store_id: storeId,
              store_name: storeName,
              week_start_date: DateTimeUtils.formatDateForAPI(weekStart),
              week_end_date: DateTimeUtils.formatDateForAPI(weekEnd),
              shifts: shifts,
              shift_count: shifts.length,
              created_by: '',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } else {
            this.currentWeekSchedule = null;
          }

          this.isCurrentWeek = true;
          this.isLoadingWeek = false;
        },
        error: (err) => {
          console.error('Error loading current employee schedule:', err);
          this.currentWeekSchedule = null;
          this.isLoadingWeek = false;
        }
      });
    } else {
      // For admin/manager, use the general getCurrentSchedule method
      this.hoursService.getCurrentSchedule().subscribe({
        next: (schedule) => {
          const fixedSchedules = this.fixScheduleData([schedule]);
          this.currentWeekSchedule = schedule;
          this.isCurrentWeek = true;
          this.isLoadingWeek = false;
        },
        error: (err) => {
          console.error('Error loading current schedule:', err);
          this.currentWeekSchedule = null;
          this.isLoadingWeek = false;
        }
      });
    }
  }

  /**
   * Update pagination information
   */
  private updatePagination(): void {
    if (this.schedules.length === this.pageSize) {
      this.totalSchedules = (this.currentPage * this.pageSize) + 1;
    } else if (this.schedules.length > 0) {
      this.totalSchedules = ((this.currentPage - 1) * this.pageSize) + this.schedules.length;
    } else {
      this.totalSchedules = (this.currentPage - 1) * this.pageSize;
    }
  }

  deleteSchedule(scheduleId: string): void {
    if (!scheduleId) return;

    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }

    this.loading = true;

    this.hoursService.deleteSchedule(scheduleId).subscribe({
      next: (result) => {
        if (result) {
          // Remove from the list
          this.schedules = this.schedules.filter(s => s._id !== scheduleId);

          // If this was the current week schedule, clear it
          if (this.currentWeekSchedule && this.currentWeekSchedule._id === scheduleId) {
            this.currentWeekSchedule = null;
          }
        } else {
          alert('Failed to delete schedule. Please try again.');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error deleting schedule:', err);
        alert('Error deleting schedule: ' + err.message);
        this.loading = false;
      }
    });
  }

  /**
  * Returns visible shifts based on user role with improved string comparison
  * to ensure consistent ID matching
  */
  getVisibleShifts(schedule: Schedule): ScheduleShift[] {
    if (!schedule) return [];
    
    // Handle MongoDB format shifts - with proper typing
    let shifts: ScheduleShift[] = [];
    
    if (schedule.shifts) {
      // If it's already an array, use it directly
      if (Array.isArray(schedule.shifts)) {
        shifts = schedule.shifts;
      } 
      // Handle MongoDB response format (object with numeric keys)
      else if (typeof schedule.shifts === 'object') {
        shifts = Object.values(schedule.shifts) as ScheduleShift[];
      }
    }
    
    const role = this.permissionService.getRoleIdentifier();
    
    // For admins and managers, show all shifts
    if (role === 'admin' || role === 'manager') {
      return shifts;
    }
    
    // For employees, filter to their shifts only
    if (role === 'employee' && this.currentEmployeeId) {
      const employeeIdStr = String(this.currentEmployeeId);
      return shifts.filter(shift => {
        if (!shift || !shift.employee_id) return false;
        return String(shift.employee_id) === employeeIdStr;
      });
    }
    
    return shifts;
  }

  getPreviewShifts(shifts: any[]): any[] {
    if (!shifts || !Array.isArray(shifts)) return [];
    return shifts.slice(0, 3);
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadSchedules();
    }
  }

  nextPage(): void {
    if (this.schedules.length === this.pageSize) {
      this.currentPage++;
      this.loadSchedules();
    }
  }

  trackByScheduleId(index: number, schedule: Schedule): string {
    return schedule._id || `schedule-${index}`;
  }

  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
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

  getDayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }

  /**
  * Get the total shift count for a schedule, with improved admin/employee handling
  */
  getShiftCount(schedule: Schedule | null): number {
    if (!schedule) return 0;
    
    // Use the shift_count property from the API if available
    if (schedule.shift_count !== undefined) {
      return schedule.shift_count;
    }
    
    // Fallback to counting shifts array if shift_count is not available
    if (Array.isArray(schedule.shifts)) {
      return schedule.shifts.length;
    }
    
    return 0;
  }

  /**
 * Load schedule for a specific week using the employee/me endpoint
 */
  loadEmployeeScheduleForWeek(weekStartDate: Date): void {
    this.isLoadingWeek = true;

    const weekStart = this.getWeekStartDate(weekStartDate);

    // Check if this is the current week
    const currentWeekStart = this.getWeekStartDate(new Date());
    this.isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

    // Format date for API
    const weekStartStr = DateTimeUtils.formatDateForAPI(weekStart);
    console.log(`Loading employee schedule for week starting: ${weekStartStr}`);

    // Different approach for employees vs managers/admins
    if (this.userRole === 'employee') {
      // Use the updated hoursService method with week_start_date parameter
      this.hoursService.getMyScheduleShifts(undefined, weekStartStr).subscribe({
        next: (shifts: any[]) => {
          console.log(`Got ${shifts.length} shifts for week starting ${weekStartStr}`);

          if (shifts.length === 0) {
            this.currentWeekSchedule = null;
            this.isLoadingWeek = false;
            this.changeDetector.detectChanges();
            return;
          }

          // Extract common schedule data from the first shift
          const firstShift = shifts[0];
          const scheduleId = firstShift.schedule_id || '';
          const storeId = firstShift.store_id || '';
          const storeName = firstShift.store_name || '';
          const scheduleTitle = firstShift.schedule_title || 'Weekly Schedule';

          // Calculate week end date (6 days after start)
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);

          // Build a Schedule object from the shifts
          this.currentWeekSchedule = {
            _id: scheduleId,
            title: scheduleTitle,
            store_id: storeId,
            store_name: storeName,
            week_start_date: weekStartStr,
            week_end_date: DateTimeUtils.formatDateForAPI(weekEnd),
            shifts: shifts,
            shift_count: shifts.length,
            created_by: '',  // Required by the interface
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        },
        error: (error: any) => {
          console.error(`Error loading employee schedule for week ${weekStartStr}:`, error);
          this.currentWeekSchedule = null;
          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        }
      });
    } else {
      // For managers/admins, use the regular getSchedules method
      const options: any = {
        start_date: weekStartStr,
        end_date: DateTimeUtils.formatDateForAPI(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
        limit: 1
      };

      if (this.storeFilter) {
        options.store_id = this.storeFilter;
      }

      this.hoursService.getSchedules(options).subscribe({
        next: (schedules) => {
          this.currentWeekSchedule = schedules.length > 0 ? schedules[0] : null;
          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        },
        error: (error: any) => {
          console.error('Error loading week schedule:', error);
          this.currentWeekSchedule = null;
          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        }
      });
    }
  }

  /**
 * Debugging function to examine and fix schedule data
 */
private fixScheduleData(schedules: any[]): any[] {
  console.log("Before fix - first schedule:", JSON.stringify(schedules[0]));
  
  return schedules.map(schedule => {
    // Make a copy to avoid mutating the original
    const fixedSchedule = {...schedule};
    
    // Extract and log the raw shifts data to debug
    console.log("Schedule ID:", fixedSchedule._id);
    console.log("Shifts type:", typeof fixedSchedule.shifts);
    console.log("Is array:", Array.isArray(fixedSchedule.shifts));
    console.log("Raw shifts data:", fixedSchedule.shifts);
    
    // Try to fix the shifts property if it exists but isn't an array
    if (fixedSchedule.shifts && !Array.isArray(fixedSchedule.shifts)) {
      console.log("Converting shifts to array");
      
      // If it's an object with numeric keys, convert to array
      if (typeof fixedSchedule.shifts === 'object') {
        fixedSchedule.shifts = Object.values(fixedSchedule.shifts);
        console.log("After conversion - shifts length:", fixedSchedule.shifts.length);
      }
    }
    
    // Ensure shifts is at least an empty array
    if (!fixedSchedule.shifts) {
      fixedSchedule.shifts = [];
    }
    
    return fixedSchedule;
  });
}

}