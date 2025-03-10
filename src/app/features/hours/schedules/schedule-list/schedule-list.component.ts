// src/app/features/hours/schedules/schedule-list/schedule-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../../core/services/hours.service';
import { StoreService } from '../../../../core/services/store.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Schedule } from '../../../../shared/models/hours.model';
import { Store } from '../../../../shared/models/store.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-schedule-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Schedules</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button 
            *appHasPermission="'hours:write'"
            routerLink="/hours/schedules/create" 
            class="btn btn-primary flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Schedule
          </button>
          <button routerLink="/hours" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Hours Dashboard
          </button>
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
      
      <!-- Schedules List -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Schedules</h2>
        
        <!-- Empty state -->
        <div *ngIf="!loading && (!schedules || schedules.length === 0)" class="text-center py-6 text-[var(--text-secondary)]">
          No schedules found matching your filters.
        </div>
        
        <!-- Schedules list -->
        <div *ngIf="!loading && schedules && schedules.length > 0" class="space-y-4">
          <div *ngFor="let schedule of schedules" class="border rounded-lg overflow-hidden bg-[var(--bg-card)]">
            <div class="border-b border-[var(--border-color)] px-6 py-4 flex justify-between items-center">
              <div>
                <h3 class="text-lg font-medium text-[var(--text-primary)]">{{ schedule.title }}</h3>
                <p class="text-sm text-[var(--text-secondary)]">
                  {{ formatDate(schedule.start_date) }} - {{ formatDate(schedule.end_date) }}
                </p>
              </div>
              <div class="flex items-center text-sm text-[var(--text-secondary)]">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {{ schedule.store_name }}
              </div>
            </div>
            
            <div class="px-6 py-4">
              <div class="text-sm mb-2">
                <span class="font-medium">Shifts:</span> {{ schedule.shifts.length }}
              </div>
              
              <!-- Show a preview of shifts (limited to first 3) -->
              <div *ngIf="schedule.shifts.length > 0" class="border-t border-[var(--border-color)] mt-2 pt-2">
                <div *ngFor="let shift of getPreviewShifts(schedule.shifts); let i = index" class="flex justify-between py-1 text-sm">
                  <div>{{ shift.employee_name }}</div>
                  <div>{{ formatDate(shift.date) }} ({{ formatTimeRange(shift.start_time, shift.end_time) }})</div>
                </div>
                
                <div *ngIf="schedule.shifts.length > 3" class="text-sm text-center text-[var(--text-secondary)] mt-2">
                  And {{ schedule.shifts.length - 3 }} more shifts...
                </div>
              </div>
            </div>
            
            <div class="bg-[var(--bg-main)] px-6 py-3 border-t border-[var(--border-color)]">
              <div class="flex justify-end space-x-2">
                <a 
                  [routerLink]="['/hours/schedules', schedule._id]" 
                  class="btn btn-sm btn-outline"
                >
                  View Details
                </a>
                
                <a 
                  *appHasPermission="'hours:write'"
                  [routerLink]="['/hours/schedules', schedule._id, 'edit']" 
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
  ) {
    // Set default date range to current month
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    
    this.startDate = firstDay.toISOString().split('T')[0];
    this.endDate = lastDay.toISOString().split('T')[0];
  }
  
  ngOnInit(): void {
    this.loadStores();
    this.loadSchedules();
  }
  
  loadStores(): void {
    // If user is a manager, they might only see their assigned stores
    const isAdmin = this.permissionService.isAdmin();
    
    this.storeService.getStores().subscribe({
      next: (stores) => {
        if (isAdmin) {
          // Admin can see all stores
          this.stores = stores;
        } else if (this.permissionService.isManager()) {
          // For managers, we assume they can access all stores for now
          // In a real implementation, you would filter based on assigned stores
          // This would need a property in the user model or a separate endpoint
          this.stores = stores;
        } else {
          // Regular employees see all stores but would have limited actions
          this.stores = stores;
        }
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
    if (!scheduleId) {
      console.error('Cannot delete schedule: Missing schedule ID');
      return;
    }
    
    if (!confirm('Are you sure you want to delete this schedule? This action cannot be undone.')) {
      return;
    }
    
    this.hoursService.deleteSchedule(scheduleId).subscribe({
      next: () => {
        // Remove the deleted schedule from the list
        this.schedules = this.schedules.filter(s => s._id !== scheduleId);
        
        // Optionally, reload the list to ensure accurate data
        // this.loadSchedules();
      },
      error: (err) => {
        console.error('Error deleting schedule:', err);
        alert('There was an error deleting the schedule. Please try again.');
      }
    });
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
  
  // Helper to get a limited number of shifts for preview
  getPreviewShifts(shifts: any[]): any[] {
    return shifts.slice(0, 3);
  }
  
  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
  }
  
  formatTimeRange(startTime: string, endTime: string): string {
    return `${this.format12HourTime(startTime)} - ${this.format12HourTime(endTime)}`;
  }
  
  format12HourTime(time: string): string {
    const [hours, minutes] = time.split(':').map(Number);
    
    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12; // Convert 0 to 12
    
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }
}