// src/app/features/schedules/schedule-list/schedule-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { Schedule } from '../../../shared/models/hours.model';
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
      
      <!-- Current Week Schedule -->
      <div *ngIf="!loading && currentWeekSchedule" class="card mb-6">
        <h2 class="text-lg font-semibold mb-4">Current Week Schedule</h2>
        
        <div class="flex flex-col md:flex-row justify-between mb-4">
          <div>
            <div class="text-sm text-[var(--text-secondary)]">Week</div>
            <div>{{ formatDate(currentWeekSchedule.week_start_date) }} - {{ formatDate(currentWeekSchedule.week_end_date) }}</div>
          </div>
          <div>
            <div class="text-sm text-[var(--text-secondary)]">Store</div>
            <div>{{ currentWeekSchedule.store_name }}</div>
          </div>
          <div>
            <div class="text-sm text-[var(--text-secondary)]">Shifts</div>
            <div>{{ getVisibleShifts(currentWeekSchedule).length }}</div>
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
    private employeeService: EmployeeService
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
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If today is Sunday, go back 6 days, otherwise go back (dayOfWeek-1) days
    
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - daysToMonday);
    
    // Use either the 1st of the month or the start of the current week, whichever is earlier
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startDate = firstDayOfMonth < currentWeekStart ? firstDayOfMonth : currentWeekStart;
    
    // End date should include at least the end of the current week (Sunday)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6); // Add 6 days to Monday to get to Sunday
    
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
   * Improved date filtering and schedule loading
   */
  loadSchedules(): void {
    this.loading = true;
    
    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    // Apply store filter based on role
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
        
        // For employees, we need special handling
        if (this.userRole === 'employee' && this.currentEmployeeId) {
          // First check if we have their shifts from regular schedules
          let employeeSchedules = schedules.filter(schedule => {
            if (!schedule.shifts || !Array.isArray(schedule.shifts)) {
              return false;
            }
            
            // Compare as strings to avoid type mismatches
            const empId = String(this.currentEmployeeId);
            return schedule.shifts.some(shift => 
              String(shift.employee_id) === empId
            );
          });
          
          console.log(`Found ${employeeSchedules.length} schedules with employee shifts`);
          
          // If we have no schedules but we know current week schedule exists
          if (employeeSchedules.length === 0 && this.currentWeekSchedule) {
            console.log('No schedules in regular results, but current week schedule exists');
            
            // Add current week schedule to the list if it's not already included
            const matchingSchedule = schedules.find(s => s._id === this.currentWeekSchedule?._id);
            if (!matchingSchedule && this.currentWeekSchedule) {
              console.log('Adding current week schedule to results');
              employeeSchedules = [this.currentWeekSchedule, ...employeeSchedules];
            }
          }
          
          this.schedules = employeeSchedules;
        } else {
          this.schedules = schedules;
        }
        
        // Process each schedule to ensure data is complete
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
                error: (err) => {
                  console.error(`Error fetching store for schedule ${schedule._id}:`, err);
                  schedule.store_name = 'Unknown Store';
                  resolve();
                }
              });
            });
            storePromises.push(promise);
          }
        });
        
        // Wait for all store lookups to complete
        Promise.all(storePromises).then(() => {
          // Update pagination
          this.updatePagination();
          this.loading = false;
          console.log(`Final schedules count: ${this.schedules.length}`);
        });
      },
      error: (err) => {
        console.error('Error loading schedules:', err);
        this.loading = false;
      }
    });
  }
  
  /**
   * Helper method for pagination
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
   * Modified to return all shifts for admins/managers and only the user's shifts for employees
   */
  getVisibleShifts(schedule: Schedule): any[] {
    if (!schedule || !schedule.shifts || !Array.isArray(schedule.shifts)) return [];
    
    const role = this.permissionService.getRoleIdentifier();
    const employeeId = this.currentEmployeeId;
    console.log(`Getting visible shifts for role: ${role}, schedule has ${schedule.shifts.length} shifts, employeeId: ${employeeId}`);
    
    // For admins and managers, show all shifts
    if (role === 'admin' || role === 'manager') {
      console.log(`Admin/Manager: Showing all ${schedule.shifts.length} shifts`);
      return schedule.shifts;
    }
    
    // For employees, filter by employee ID
    if (role === 'employee' && employeeId) {
      const employeeIdStr = String(employeeId);
      
      // Find all shifts for this employee
      const filteredShifts = schedule.shifts.filter(shift => {
        if (!shift.employee_id) return false;
        
        // Convert both to strings for comparison
        const shiftEmployeeId = String(shift.employee_id);
        const matches = shiftEmployeeId === employeeIdStr;
        
        // Log matches for debugging
        if (matches) {
          console.log(`Matched shift: ${shift.day_of_week} ${shift.start_time}-${shift.end_time}`);
        }
        
        return matches;
      });
      
      console.log(`Employee ${employeeIdStr}: Found ${filteredShifts.length} of ${schedule.shifts.length} shifts`);
      
      // If no shifts found but we know employee should have shifts, try looking for ID in raw format
      if (filteredShifts.length === 0) {
        // Check data in its raw format - sometimes IDs might be nested objects
        const rawShifts = schedule.shifts.filter(shift => {
          if (!shift.employee_id) return false;
          
          // Try to handle if employee_id is an object with $oid
          const shiftEmpId = typeof shift.employee_id === 'object' && shift.employee_id
            ? shift.employee_id
            : String(shift.employee_id);
            
          return shiftEmpId === employeeIdStr;
        });
        
        console.log(`After raw check found ${rawShifts.length} shifts`);
        if (rawShifts.length > 0) return rawShifts;
      }
      
      return filteredShifts;
    }
    
    return schedule.shifts;
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
   * Load the current week's schedule with better error handling
   */
 // In schedule-list.component.ts
loadCurrentWeekSchedule(): void {
  this.hoursService.getCurrentSchedule().subscribe({
    next: (schedule) => {
      if (schedule) {
        console.log(`Current week schedule loaded with ${schedule.shifts?.length || 0} shifts:`);
        console.log(`- ID: ${schedule._id}`);
        console.log(`- Title: ${schedule.title}`);
        console.log(`- Date range: ${schedule.week_start_date} to ${schedule.week_end_date}`);
        
        // For employees, ensure shifts contain their employee ID
        if (this.userRole === 'employee' && this.currentEmployeeId) {
          // If shifts are empty but we know there should be some for this employee,
          // try to get the full schedule and filter for this employee
          if (!schedule.shifts || schedule.shifts.length === 0) {
            console.log('No shifts found in current schedule, fetching full schedule');
            
            // Get the full schedule - add null check for schedule._id
            if (schedule._id) {
              this.hoursService.getSchedule(schedule._id).subscribe({
                next: (fullSchedule) => {
                  // Filter for this employee's shifts
                  const employeeIdStr = String(this.currentEmployeeId);
                  const employeeShifts = fullSchedule.shifts.filter(shift => 
                    String(shift.employee_id) === employeeIdStr
                  );
                  
                  console.log(`Found ${employeeShifts.length} shifts for employee in full schedule`);
                  
                  if (employeeShifts.length > 0) {
                    schedule.shifts = employeeShifts;
                  }
                  
                  this.currentWeekSchedule = schedule;
                  
                  // If the regular schedules list is empty, reload it
                  if (this.schedules.length === 0) {
                    console.log('Regular schedules list is empty, reloading with current week schedule');
                    this.loadSchedules();
                  }
                },
                error: (err) => {
                  console.error('Error loading full schedule:', err);
                  this.currentWeekSchedule = schedule;
                }
              });
            } else {
              console.error('Schedule ID is undefined, cannot fetch full schedule');
              this.currentWeekSchedule = schedule;
            }
          } else {
            this.currentWeekSchedule = schedule;
          }
        } else {
          this.currentWeekSchedule = schedule;
        }
      } else {
        console.log('No current week schedule found');
      }
    },
    error: (err) => {
      console.error('Error loading current week schedule:', err);
    }
  });
}
}