// src/app/features/hours/timesheets/all-timesheets/all-timesheets.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../../core/services/hours.service';
import { StoreService } from '../../../../core/services/store.service';
import { EmployeeService } from '../../../../core/services/employee.service';
import { WeeklyTimesheet } from '../../../../shared/models/hours.model';
import { Store } from '../../../../shared/models/store.model';
import { Employee } from '../../../../shared/models/employee.model';

@Component({
  selector: 'app-all-timesheets',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">Timesheet Management</h1>
        <div class="flex flex-col sm:flex-row gap-4">
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
            <label for="employeeFilter" class="form-label">Employee</label>
            <select 
              id="employeeFilter" 
              [(ngModel)]="employeeFilter" 
              (change)="loadTimesheets()"
              class="form-control"
            >
              <option value="">All Employees</option>
              <option *ngFor="let employee of employees" [value]="employee._id">
                {{ employee.full_name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="storeFilter" class="form-label">Store</label>
            <select 
              id="storeFilter" 
              [(ngModel)]="storeFilter" 
              (change)="loadTimesheets()"
              class="form-control"
            >
              <option value="">All Stores</option>
              <option *ngFor="let store of stores" [value]="store._id">
                {{ store.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="statusFilter" class="form-label">Status</label>
            <select 
              id="statusFilter" 
              [(ngModel)]="statusFilter" 
              (change)="loadTimesheets()"
              class="form-control"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Pending Approval</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div class="form-group">
            <label for="startDate" class="form-label">Start Date</label>
            <input 
              type="date" 
              id="startDate" 
              [(ngModel)]="startDate" 
              (change)="loadTimesheets()"
              class="form-control"
            >
          </div>
          
          <div class="form-group">
            <label for="endDate" class="form-label">End Date</label>
            <input 
              type="date" 
              id="endDate" 
              [(ngModel)]="endDate" 
              (change)="loadTimesheets()"
              class="form-control"
            >
          </div>
        </div>
      </div>
      
      <!-- Loading Indicator -->
      <div *ngIf="loading" class="flex justify-center my-10">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Timesheets Table -->
      <div class="card">
        <h2 class="text-lg font-semibold mb-4">Timesheets</h2>
        
        <!-- Empty state -->
        <div *ngIf="!loading && (!timesheets || timesheets.length === 0)" class="text-center py-6 text-[var(--text-secondary)]">
          No timesheets found matching your filters.
        </div>
        
        <!-- Timesheets list -->
        <div *ngIf="!loading && timesheets && timesheets.length > 0" class="border rounded overflow-hidden">
          <table class="min-w-full divide-y divide-[var(--border-color)]">
            <thead class="bg-[var(--bg-main)]">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Employee</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Week</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Store</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Hours</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Status</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Submitted</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-slate-800 divide-y divide-[var(--border-color)]">
              <tr *ngFor="let timesheet of timesheets">
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--text-primary)]">
                  {{ timesheet.employee_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ formatDate(timesheet.week_start_date) }} - {{ formatDate(timesheet.week_end_date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ timesheet.store_name }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-primary)]">
                  {{ timesheet.total_hours.toFixed(1) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <span 
                    [ngClass]="{
                      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': timesheet.status === 'approved',
                      'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200': timesheet.status === 'submitted',
                      'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200': timesheet.status === 'draft',
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': timesheet.status === 'rejected'
                    }"
                    class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  >
                    {{ timesheet.status | titlecase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">
                  {{ timesheet.submitted_at ? formatDate(timesheet.submitted_at) : 'Not Submitted' }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm">
                  <div class="flex space-x-2">
                    <a 
                      [routerLink]="['/hours/timesheets', timesheet._id]" 
                      class="btn btn-xs btn-outline"
                    >
                      View
                    </a>
                    
                    <button 
                      *ngIf="timesheet.status === 'submitted'"
                      (click)="approveTimesheet(timesheet._id || '')" 
                      class="btn btn-xs btn-success"
                      [disabled]="!timesheet._id"
                    >
                      Approve
                    </button>
                    
                    <button 
                      *ngIf="timesheet.status === 'submitted'"
                      (click)="rejectTimesheet(timesheet._id || '')" 
                      class="btn btn-xs btn-danger"
                      [disabled]="!timesheet._id"
                    >
                      Reject
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <!-- Pagination controls -->
        <div *ngIf="!loading && timesheets && timesheets.length > 0" class="flex justify-between items-center mt-4">
          <div>
            <span class="text-sm text-[var(--text-secondary)]">
              Showing {{ timesheets.length }} of {{ totalTimesheets }} timesheets
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
              [disabled]="timesheets.length < pageSize"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AllTimesheetsComponent implements OnInit {
  loading = true;
  timesheets: WeeklyTimesheet[] = [];
  stores: Store[] = [];
  employees: Employee[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10;
  totalTimesheets = 0;
  
  // Filters
  employeeFilter = '';
  storeFilter = '';
  statusFilter = '';
  startDate = '';
  endDate = '';
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private employeeService: EmployeeService
  ) {
    // Set default date range to the last 30 days
    const today = new Date();
    this.endDate = today.toISOString().split('T')[0];
    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    this.startDate = thirtyDaysAgo.toISOString().split('T')[0];
  }
  
  ngOnInit(): void {
    this.loadStores();
    this.loadEmployees();
    this.loadTimesheets();
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
  
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (err) => {
        console.error('Error loading employees:', err);
      }
    });
  }
  
  loadTimesheets(): void {
    this.loading = true;
    
    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    if (this.employeeFilter) {
      options.employee_id = this.employeeFilter;
    }
    
    if (this.storeFilter) {
      options.store_id = this.storeFilter;
    }
    
    if (this.statusFilter) {
      options.status = this.statusFilter;
    }
    
    if (this.startDate) {
      options.start_date = this.startDate;
    }
    
    if (this.endDate) {
      options.end_date = this.endDate;
    }
    
    this.hoursService.getTimesheets(options).subscribe({
      next: (timesheets) => {
        this.timesheets = timesheets;
        
        // For real pagination, we would get the total count from the API
        // For now, we'll estimate based on the returned results
        if (timesheets.length === this.pageSize) {
          // If we got a full page, there are probably more
          this.totalTimesheets = (this.currentPage * this.pageSize) + 1;
        } else if (timesheets.length > 0) {
          // If we got a partial page, this is the last page
          this.totalTimesheets = ((this.currentPage - 1) * this.pageSize) + timesheets.length;
        } else {
          // If we got no results, either there are no results or we're past the end
          this.totalTimesheets = (this.currentPage - 1) * this.pageSize;
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading timesheets:', err);
        this.loading = false;
      }
    });
  }
  
  approveTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot approve timesheet: Missing timesheet ID');
      return;
    }
    
    this.hoursService.approveTimesheet(timesheetId).subscribe({
      next: () => {
        // Refresh the list
        this.loadTimesheets();
      },
      error: (err) => {
        console.error('Error approving timesheet:', err);
      }
    });
  }
  
  rejectTimesheet(timesheetId: string): void {
    if (!timesheetId) {
      console.error('Cannot reject timesheet: Missing timesheet ID');
      return;
    }
    
    const reason = prompt('Please enter a reason for rejecting this timesheet:');
    if (!reason) return;
    
    this.hoursService.rejectTimesheet(timesheetId, reason).subscribe({
      next: () => {
        // Refresh the list
        this.loadTimesheets();
      },
      error: (err) => {
        console.error('Error rejecting timesheet:', err);
      }
    });
  }
  
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadTimesheets();
    }
  }
  
  nextPage(): void {
    if (this.timesheets.length === this.pageSize) {
      this.currentPage++;
      this.loadTimesheets();
    }
  }
  
  formatDate(dateStr?: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  }
}