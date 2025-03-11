// src/app/features/schedules/schedule-list/schedule-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
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
          <div class="form-group">
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
            <div>{{ currentWeekSchedule.shifts.length }}</div>
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
                <div class="font-medium">{{ schedule.shifts.length }}</div>
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
              <div *ngIf="schedule.shifts.length > 0" class="mt-4">
                <div class="text-sm font-medium mb-2">Shift Preview:</div>
                <div class="space-y-1">
                  <div *ngFor="let shift of getPreviewShifts(schedule.shifts); let i = index" class="text-sm">
                    <span class="text-[var(--text-primary)]">{{ getDayName(shift.day_of_week) }}:</span>
                    <span class="text-[var(--text-secondary)] ml-1">{{ shift.employee_name || 'Employee' }} ({{ formatShiftTime(shift.start_time) }} - {{ formatShiftTime(shift.end_time) }})</span>
                  </div>
                  <div *ngIf="schedule.shifts.length > 3" class="text-sm text-[var(--text-secondary)] italic">
                    And {{ schedule.shifts.length - 3 }} more shifts...
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
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    this.setupDateRange();
    this.loadStores();
    this.loadSchedules();
  }
  
  setupDateRange(): void {
    // Default date range (current month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.startDate = DateTimeUtils.formatDateForAPI(firstDayOfMonth);
    this.endDate = DateTimeUtils.formatDateForAPI(lastDayOfMonth);
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
  
  loadSchedules(): void {
    this.loading = true;
    
    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    if (this.storeFilter) {
      options.store_id = this.storeFilter;
    }
    
    if (this.startDate) {
      options.start_date = this.startDate;
    }
    
    if (this.endDate) {
      options.end_date = this.endDate;
    }
    
    this.hoursService.getSchedules(options).subscribe({
      next: (schedules) => {
        this.schedules = schedules;
        
        // Find current week's schedule
        const today = new Date();
        this.currentWeekSchedule = schedules.find(schedule => {
          const startDate = new Date(schedule.week_start_date);
          const endDate = new Date(schedule.week_end_date);
          return today >= startDate && today <= endDate;
        }) || null;
        
        // For real pagination, we would get the total count from the API
        // For now, we'll estimate based on the returned results
        if (schedules.length === this.pageSize) {
          // If we got a full page, there are probably more
          this.totalSchedules = (this.currentPage * this.pageSize) + 1;
        } else if (schedules.length > 0) {
          // If we got a partial page, this is the last page
          this.totalSchedules = ((this.currentPage - 1) * this.pageSize) + schedules.length;
        } else {
          // If we got no results, either there are no results or we're past the end
          this.totalSchedules = (this.currentPage - 1) * this.pageSize;
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading schedules:', err);
        this.loading = false;
      }
    });
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
  
  getPreviewShifts(shifts: any[]): any[] {
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
}