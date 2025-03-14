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
        <div>{{ getShiftCount(currentWeekSchedule) }}</div>
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
            <div class="font-medium">{{ getShiftCount(schedule) }}</div>
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
          
          <!-- Shift information message -->
          <div class="mt-4">
            <div class="text-sm text-[var(--text-secondary)] italic">
              View schedule details to see all {{ getShiftCount(schedule) }} shifts
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
  private logScheduleStructure(schedule: any, label: string): void {
    console.log(`[DEBUG] ${label} - schedule structure:`, {
      id: schedule._id,
      title: schedule.title,
      shift_count: schedule.shift_count,
      store_id: schedule.store_id,
      store_name: schedule.store_name,
      shiftsType: typeof schedule.shifts,
      shiftsIsArray: Array.isArray(schedule.shifts),
      shiftsLength: Array.isArray(schedule.shifts) ? schedule.shifts.length : 
                  (schedule.shifts && typeof schedule.shifts === 'object' ? 
                    Object.keys(schedule.shifts).length : 0)
    });
  }

  loading = true;
  schedules: Schedule[] = [];
  currentWeekSchedule: Schedule | null = null;
  fullSchedules: Map<string, Schedule> = new Map(); // Store full schedule data for admins/managers
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
  ) {}

  ngOnInit(): void {
    this.setupDateRange();
    this.setupUserRole();
    this.loadStores();
    this.loadCurrentWeekSchedule();
  }

  setupUserRole(): void {
    // Determine user role
    this.userRole = this.permissionService.getRoleIdentifier();
    console.log(`[DEBUG] User role initialized: ${this.userRole}`);

    // For employees and managers, we need their employee ID for filtering
    if (this.userRole === 'employee' || this.userRole === 'manager') {
      this.showStoreFilter = this.userRole === 'manager';

      // Get employee ID for current user
      this.hoursService.getCurrentEmployeeId().subscribe(employeeId => {
        this.currentEmployeeId = employeeId;
        console.log(`[DEBUG] Current employee ID set: ${this.currentEmployeeId}`);
        this.loadSchedules();
      });
    } else {
      // Admin can see all schedules
      console.log(`[DEBUG] Admin user detected, showing all schedules`);
      this.loadSchedules();
    }
  }

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

    console.log(`[DEBUG] Date range set to: ${this.startDate} to ${this.endDate}`);
  }

  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        console.log(`[DEBUG] Loaded ${stores.length} stores`);
      },
      error: (err) => {
        console.error('[ERROR] Error loading stores:', err);
      }
    });
  }

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

    console.log(`[DEBUG] Loading schedule for week: ${weekStartStr} to ${weekEndStr}`);

    // Make request without store filter to see schedules from all stores
    this.hoursService.getSchedules({
      start_date: weekStartStr,
      end_date: weekEndStr
    }).subscribe({
      next: (schedules) => {
        console.log(`[DEBUG] Received ${schedules.length} schedules for week navigation`);
        
        // Always normalize and store the full schedule data
        const normalizedSchedules = schedules.map(schedule => this.normalizeScheduleData(schedule));
        
        if (normalizedSchedules.length === 0) {
          console.log('[DEBUG] No schedules found for the selected week');
          this.currentWeekSchedule = null;
        } else {
          if (this.userRole === 'employee' && this.currentEmployeeId) {
            // For employees, we need to combine shifts from multiple schedules
            const employeeIdStr = String(this.currentEmployeeId);
            let selectedSchedule = null;

            console.log(`[DEBUG] Employee view: Filtering shifts for employee ID: ${employeeIdStr}`);

            // Since we don't have shifts in the response, we'll use the schedule with metadata
            // and fetch the shifts separately if needed for detailed view
            for (const schedule of normalizedSchedules) {
              // For now, just take the first schedule as we can't check shift membership
              if (!selectedSchedule) {
                selectedSchedule = schedule;
              }
            }

            if (selectedSchedule) {
              // Create a schedule for this employee with metadata
              this.currentWeekSchedule = selectedSchedule;
              
              // Make sure to load store names
              this.loadStoreNameForSchedule(this.currentWeekSchedule);
            } else {
              // No schedules found
              console.log('[DEBUG] No schedules found for this employee');
              this.currentWeekSchedule = null;
            }
          } else {
            // For admin/manager, just use the first schedule
            console.log(`[DEBUG] Admin/Manager: Using first schedule: ${normalizedSchedules[0].title} with shift count: ${normalizedSchedules[0].shift_count || 0}`);
            this.currentWeekSchedule = normalizedSchedules[0];
            
            // Make sure to load store names
            this.loadStoreNameForSchedule(this.currentWeekSchedule);
          }
        }

        this.isLoadingWeek = false;
      },
      error: (err) => {
        console.error('[ERROR] Error loading week schedule:', err);
        this.currentWeekSchedule = null;
        this.isLoadingWeek = false;
      }
    });
  }

  navigateToPreviousWeek(): void {
    if (this.selectedWeekStartDate) {
      const previousWeekStart = new Date(this.selectedWeekStartDate);
      previousWeekStart.setDate(previousWeekStart.getDate() - 7);
      this.selectedWeekStartDate = previousWeekStart;

      // Load schedule using the specialized employee/me endpoint
      this.loadEmployeeScheduleForWeek(previousWeekStart);
    }
  }

  navigateToNextWeek(): void {
    if (this.selectedWeekStartDate) {
      const nextWeekStart = new Date(this.selectedWeekStartDate);
      nextWeekStart.setDate(nextWeekStart.getDate() + 7);
      this.selectedWeekStartDate = nextWeekStart;

      // Load schedule using the specialized employee/me endpoint
      this.loadEmployeeScheduleForWeek(nextWeekStart);
    }
  }

  getWeekStartDate(date: Date): Date {
    const result = new Date(date);
    const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = result.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    result.setDate(diff);
    result.setHours(0, 0, 0, 0);
    return result;
  }

  loadSchedules(): void {
    this.loading = true;
  
    // Different approach for employees vs managers/admins
    if (this.userRole === 'employee' && this.currentEmployeeId) {
      console.log(`[DEBUG] Employee view: Using specialized employee endpoint for schedules`);
      
      // Prepare filter options
      const options: any = {};
      
      if (this.startDate) {
        options.start_date = this.startDate;
        console.log(`[DEBUG] Using start date filter: ${this.startDate}`);
      }
      
      if (this.endDate) {
        options.end_date = this.endDate;
        console.log(`[DEBUG] Using end date filter: ${this.endDate}`);
      }
      
      // Use employee-specific endpoint with the current employee ID
      this.hoursService.getEmployeeAllSchedules(this.currentEmployeeId, options).subscribe({
        next: (schedules) => {
          console.log(`[DEBUG] Received ${schedules.length} employee schedules from API`);
          
          // Process the schedules to ensure consistent data format
          const normalizedSchedules = schedules.map(schedule => this.normalizeScheduleData(schedule));
          
          this.schedules = normalizedSchedules;
          
          // Fetch store names for schedules if needed
          this.enhanceSchedulesWithStoreNames();
  
          // Update pagination based on employee's schedules
          this.totalSchedules = schedules.length; // For employees, we typically show all their schedules
          this.loading = false;
        },
        error: (err) => {
          console.error('[ERROR] Error loading employee schedules:', err);
          this.loading = false;
        }
      });
    } else {
      // For admin and manager users, use the regular schedules endpoint with pagination
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
        console.log(`[DEBUG] Using start date filter: ${this.startDate}`);
      }
  
      if (this.endDate) {
        options.end_date = this.endDate;
        console.log(`[DEBUG] Using end date filter: ${this.endDate}`);
      }
  
      console.log(`[DEBUG] Admin/Manager view: Loading schedules with filters:`, options);
  
      this.hoursService.getSchedules(options).subscribe({
        next: (schedules) => {
          console.log(`[DEBUG] Received ${schedules.length} schedules from API`);
          
          // Log the first schedule's raw structure to debug the API response format
          if (schedules.length > 0) {
            console.log('[DEBUG] First schedule raw data:', {
              id: schedules[0]._id,
              title: schedules[0].title,
              shift_count: schedules[0].shift_count,
              store_id: schedules[0].store_id,
              store_name: schedules[0].store_name
            });
          }
          
          // Process the schedules to ensure consistent data format
          const normalizedSchedules = schedules.map(schedule => this.normalizeScheduleData(schedule));
          
          // Admin and managers see all schedules
          console.log(`[DEBUG] Admin/Manager view: Showing all ${normalizedSchedules.length} schedules`);
          this.schedules = normalizedSchedules;
  
          // Fetch store names for schedules if needed
          this.enhanceSchedulesWithStoreNames();
  
          this.updatePagination();
          this.loading = false;
        },
        error: (err) => {
          console.error('[ERROR] Error loading schedules:', err);
          this.loading = false;
        }
      });
    }
  }

  enhanceSchedulesWithStoreNames(): void {
    const storePromises: Promise<void>[] = [];

    this.schedules.forEach(schedule => {
      if (!schedule.store_name && schedule.store_id) {
        const promise = new Promise<void>((resolve) => {
          this.storeService.getStoreById(schedule.store_id).subscribe({
            next: (store) => {
              schedule.store_name = store.name;
              console.log(`[DEBUG] Added store name ${store.name} to schedule ${schedule._id}`);
              resolve();
            },
            error: () => {
              schedule.store_name = 'Unknown Store';
              console.log(`[DEBUG] Could not find store for ID ${schedule.store_id}`);
              resolve();
            }
          });
        });
        storePromises.push(promise);
      }
    });

    // Wait for all store lookups to complete
    Promise.all(storePromises).then(() => {
      // Trigger change detection after all store names are loaded
      this.changeDetector.detectChanges();
    });
  }

  loadStoreNameForSchedule(schedule: Schedule | null): void {
    if (!schedule || schedule.store_name || !schedule.store_id) return;
    
    this.storeService.getStoreById(schedule.store_id).subscribe({
      next: (store) => {
        schedule.store_name = store.name;
        console.log(`[DEBUG] Added store name ${store.name} to current week schedule`);
        this.changeDetector.detectChanges();
      },
      error: () => {
        schedule.store_name = 'Unknown Store';
        console.log(`[DEBUG] Could not find store for current week schedule`);
        this.changeDetector.detectChanges();
      }
    });
  }

  private updatePagination(): void {
    if (this.schedules.length === this.pageSize) {
      this.totalSchedules = (this.currentPage * this.pageSize) + 1;
    } else if (this.schedules.length > 0) {
      this.totalSchedules = ((this.currentPage - 1) * this.pageSize) + this.schedules.length;
    } else {
      this.totalSchedules = (this.currentPage - 1) * this.pageSize;
    }
    console.log(`[DEBUG] Pagination updated: page ${this.currentPage}, showing ${this.schedules.length} of ${this.totalSchedules} total`);
  }

  deleteSchedule(scheduleId: string): void {
    if (!scheduleId) return;

    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }

    this.loading = true;
    console.log(`[DEBUG] Deleting schedule ${scheduleId}`);

    this.hoursService.deleteSchedule(scheduleId).subscribe({
      next: (result) => {
        if (result) {
          console.log(`[DEBUG] Schedule ${scheduleId} deleted successfully`);
          // Remove from the list
          this.schedules = this.schedules.filter(s => s._id !== scheduleId);
          // Remove from full schedules map
          this.fullSchedules.delete(scheduleId);

          // If this was the current week schedule, clear it
          if (this.currentWeekSchedule && this.currentWeekSchedule._id === scheduleId) {
            this.currentWeekSchedule = null;
          }
        } else {
          console.error(`[ERROR] Failed to delete schedule ${scheduleId}`);
          alert('Failed to delete schedule. Please try again.');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('[ERROR] Error deleting schedule:', err);
        alert('Error deleting schedule: ' + err.message);
        this.loading = false;
      }
    });
  }

  getVisibleShifts(schedule: Schedule): ScheduleShift[] {
    if (!schedule) return [];
    
    // Since the shifts aren't included in the schedules list API response,
    // we'll use an empty array here. For a complete implementation, we'd
    // need to fetch shifts separately when needed.
    return [];
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

  getShiftCount(schedule: Schedule | null): number {
    if (!schedule) return 0;
    
    // Always use the shift_count property if it's set (from the API)
    if (schedule.shift_count !== undefined && schedule.shift_count !== null) {
      return schedule.shift_count;
    }
    
    // Fall back to counting the shifts array (if available)
    if (Array.isArray(schedule.shifts)) {
      return schedule.shifts.length;
    }
    
    // Last resort
    return 0;
  }

  loadEmployeeScheduleForWeek(weekStartDate: Date): void {
    this.isLoadingWeek = true;

    const weekStart = this.getWeekStartDate(weekStartDate);

    // Check if this is the current week
    const currentWeekStart = this.getWeekStartDate(new Date());
    this.isCurrentWeek = weekStart.getTime() === currentWeekStart.getTime();

    // Format date for API
    const weekStartStr = DateTimeUtils.formatDateForAPI(weekStart);
    console.log(`[DEBUG] Loading employee schedule for week starting: ${weekStartStr}`);

    // Different approach for employees vs managers/admins
    if (this.userRole === 'employee') {
      console.log(`[DEBUG] Employee view: Using specialized endpoint for employee shifts`);
      // Use the updated hoursService method with week_start_date parameter
      this.hoursService.getMyScheduleShifts(undefined, weekStartStr).subscribe({
        next: (shifts: any[]) => {
          console.log(`[DEBUG] Got ${shifts.length} shifts for week starting ${weekStartStr}`);

          if (shifts.length === 0) {
            console.log(`[DEBUG] No shifts found for employee in week ${weekStartStr}`);
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

          console.log(`[DEBUG] Building schedule from shifts. Schedule ID: ${scheduleId}, Store: ${storeName}`);

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

          // If store name is missing, try to load it
          if (!storeName && storeId) {
            this.loadStoreNameForSchedule(this.currentWeekSchedule);
          }

          console.log(`[DEBUG] Created schedule with ${shifts.length} employee shifts`);
          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        },
        error: (error: any) => {
          console.error(`[ERROR] Error loading employee schedule for week ${weekStartStr}:`, error);
          this.currentWeekSchedule = null;
          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        }
      });
    } else {
      // For managers/admins, use the regular getSchedules method
      console.log(`[DEBUG] Admin/Manager view: Using standard schedule endpoint`);
      const options: any = {
        start_date: weekStartStr,
        end_date: DateTimeUtils.formatDateForAPI(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)),
        limit: 1
      };

      if (this.storeFilter) {
        options.store_id = this.storeFilter;
        console.log(`[DEBUG] Applying store filter: ${this.storeFilter}`);
      }

      this.hoursService.getSchedules(options).subscribe({
        next: (schedules) => {
          // Normalize schedule data
          const normalizedSchedules = schedules.map(schedule => this.normalizeScheduleData(schedule));
          
          if (normalizedSchedules.length > 0) {
            const schedule = normalizedSchedules[0];
            console.log(`[DEBUG] Found schedule for week: ${schedule.title} with shift count: ${schedule.shift_count || 0}`);
            
            // Store full schedule data
            if (schedule._id) {
              this.fullSchedules.set(schedule._id, {...schedule});
            }
            
            this.currentWeekSchedule = schedule;
            
            // Load store name if missing
            this.loadStoreNameForSchedule(this.currentWeekSchedule);
          } else {
            console.log(`[DEBUG] No schedule found for week starting ${weekStartStr}`);
            this.currentWeekSchedule = null;
          }
          
          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        },
        error: (error: any) => {
          console.error('[ERROR] Error loading week schedule:', error);
          this.currentWeekSchedule = null;
          this.isLoadingWeek = false;
          this.changeDetector.detectChanges();
        }
      });
    }
  }

  loadCurrentWeekSchedule(): void {
    console.log('Loading current week schedule');
    this.hoursService.getCurrentSchedule().subscribe({
      next: (schedule) => {
        if (schedule) {
          console.log(`[DEBUG] Current week schedule loaded: ${schedule.title} with shift count: ${schedule.shift_count || 0}`);

          // Normalize the schedule
          const normalizedSchedule = this.normalizeScheduleData(schedule);
          
          this.currentWeekSchedule = normalizedSchedule;
          this.isCurrentWeek = true;
          
          // Load store name if missing
          this.loadStoreNameForSchedule(this.currentWeekSchedule);
        } else {
          console.log('[DEBUG] No current week schedule found');
          this.currentWeekSchedule = null;
        }
      },
      error: (error) => {
        console.error('[ERROR] Error loading current week schedule:', error);
        this.currentWeekSchedule = null;
      }
    });
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

  private normalizeScheduleData(schedule: Schedule): Schedule {
    if (!schedule) return schedule;
    
    // Log the structure before normalization
    this.logScheduleStructure(schedule, 'Before normalization');
    
    // Create a deep copy to avoid mutating the original
    const normalizedSchedule = JSON.parse(JSON.stringify(schedule));
    
    // Preserve the API-provided shift_count
    const apiShiftCount = normalizedSchedule.shift_count;
    
    // Empty shifts array if not present (the API doesn't include shifts in the list response)
    if (!normalizedSchedule.shifts) {
      normalizedSchedule.shifts = [];
      console.log(`[DEBUG] Created empty shifts array for schedule ${normalizedSchedule._id}`);
    } else if (!Array.isArray(normalizedSchedule.shifts)) {
      // Handle case where shifts might be an object
      if (typeof normalizedSchedule.shifts === 'object') {
        normalizedSchedule.shifts = Object.values(normalizedSchedule.shifts);
        console.log(`[DEBUG] Converted shifts object to array with ${normalizedSchedule.shifts.length} items`);
      } else {
        normalizedSchedule.shifts = [];
        console.log(`[DEBUG] Unexpected shifts format, created empty array`);
      }
    }
    
    // Make sure to use the API-provided shift_count if available
    if (apiShiftCount !== undefined && apiShiftCount !== null) {
      normalizedSchedule.shift_count = apiShiftCount;
    } else {
      // Only set shift_count from array length if not provided by API
      normalizedSchedule.shift_count = normalizedSchedule.shifts.length;
    }
    
    console.log(`[DEBUG] Schedule ${normalizedSchedule._id} normalized with shift_count: ${normalizedSchedule.shift_count}`);
    
    // Log the structure after normalization
    this.logScheduleStructure(normalizedSchedule, 'After normalization');
    
    return normalizedSchedule;
  }
}
