// src/app/features/timesheets/timesheet-approval/timesheet-approval.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { WeeklyTimesheet, TimesheetUtils } from '../../../shared/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { Employee } from '../../../shared/models/employee.model';

@Component({
  selector: 'app-timesheet-approval',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './timesheet-approval.component.html'
})
export class TimesheetApprovalComponent implements OnInit {
  loading = true;
  error = '';
  
  // Timesheets
  pendingTimesheets: WeeklyTimesheet[] = [];
  processedTimesheets: WeeklyTimesheet[] = [];
  
  // Filters
  employeeFilter = '';
  storeFilter = '';
  dateRangeFilter = 'past-month';
  startDate = '';
  endDate = '';
  
  // Pagination
  currentPage = 1;
  pageSize = 5;
  
  // Data for filters
  employees: Employee[] = [];
  stores: Store[] = [];
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private employeeService: EmployeeService
  ) {}
  
  ngOnInit(): void {
    this.loadEmployees();
    this.loadStores();
    this.applyDateRangeFilter(); // Sets default date range
    this.loadTimesheets();
  }
  
  loadEmployees(): void {
    this.employeeService.getEmployees().subscribe({
      next: (employees) => {
        this.employees = employees;
      },
      error: (err) => {
        console.error('Error loading employees:', err);
        this.error = 'Failed to load employees. Please try again later.';
      }
    });
  }
  
  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = 'Failed to load stores. Please try again later.';
      }
    });
  }
  
  loadTimesheets(): void {
    this.loading = true;
    this.error = '';
    
    // Create filter options
    const options: any = {};
    
    if (this.employeeFilter) {
      options.employee_id = this.employeeFilter;
    }
    
    if (this.storeFilter) {
      options.store_id = this.storeFilter;
    }
    
    if (this.startDate) {
      options.start_date = this.startDate;
    }
    
    if (this.endDate) {
      options.end_date = this.endDate;
    }
    
    // First load pending timesheets (status = submitted)
    this.hoursService.getTimesheets({
      ...options,
      status: 'submitted'
    }).subscribe({
      next: (timesheets) => {
        this.pendingTimesheets = timesheets.map(timesheet => this.enrichTimesheet(timesheet));
        console.log(`Loaded ${this.pendingTimesheets.length} pending timesheets`);
        
        // Then load processed timesheets (status = approved or rejected)
        // with pagination
        this.loadProcessedTimesheets(options);
      },
      error: (err) => {
        console.error('Error loading pending timesheets:', err);
        this.error = 'Failed to load pending timesheets. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  loadProcessedTimesheets(options: any): void {
    // Add pagination to options
    const paginatedOptions = {
      ...options,
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    // Create a combined status query for approved OR rejected
    // The API should support this format: status=approved,rejected
    this.hoursService.getTimesheets({
      ...paginatedOptions,
      status: 'approved,rejected'
    }).subscribe({
      next: (timesheets) => {
        this.processedTimesheets = timesheets.map(timesheet => this.enrichTimesheet(timesheet));
        console.log(`Loaded ${this.processedTimesheets.length} processed timesheets`);
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading processed timesheets:', err);
        this.error = 'Failed to load processed timesheets. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  // Helper method to add missing fields to timesheet objects
  enrichTimesheet(timesheet: WeeklyTimesheet): WeeklyTimesheet {
    // Ensure we have a complete timesheet with all required fields
    const enriched = TimesheetUtils.ensureComplete(timesheet);
    
    // Add store name if missing
    if (!enriched.store_name && enriched.store_id) {
      const store = this.stores.find(s => s._id === enriched.store_id);
      if (store) {
        enriched.store_name = store.name;
      }
    }
    
    // Add employee name if missing
    if (!enriched.employee_name && enriched.employee_id) {
      const employee = this.employees.find(e => e._id === enriched.employee_id);
      if (employee) {
        enriched.employee_name = employee.full_name;
      }
    }
    
    return enriched;
  }
  
  applyDateRangeFilter(): void {
    const today = new Date();
    const endDate = new Date(today);
    let startDate: Date;
    
    switch (this.dateRangeFilter) {
      case 'past-month':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case 'past-3-months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      case 'past-6-months':
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 6);
        break;
      case 'past-year':
        startDate = new Date(today);
        startDate.setFullYear(today.getFullYear() - 1);
        break;
      case 'custom':
        // Don't change anything, use the values from the inputs
        return;
      default:
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
    }
    
    this.startDate = DateTimeUtils.formatDateForAPI(startDate);
    this.endDate = DateTimeUtils.formatDateForAPI(endDate);
    
    // Reset to first page when filter changes
    this.currentPage = 1;
    this.loadTimesheets();
  }
  
  approveTimesheet(id: string): void {
    if (!id) return;
    
    this.loading = true;
    
    this.hoursService.approveTimesheet(id).subscribe({
      next: (timesheet) => {
        // Remove from pending and add to processed
        this.pendingTimesheets = this.pendingTimesheets.filter(t => t._id !== id);
        
        // Only add to processed if it fits our current filter criteria
        if (this.processedTimesheets.length < this.pageSize) {
          this.processedTimesheets = [timesheet, ...this.processedTimesheets].slice(0, this.pageSize);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error approving timesheet:', err);
        this.error = 'Failed to approve timesheet. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  rejectTimesheet(id: string): void {
    if (!id) return;
    
    const reason = prompt('Please enter a reason for rejecting this timesheet:');
    if (!reason) return; // User cancelled
    
    this.loading = true;
    
    this.hoursService.rejectTimesheet(id, reason).subscribe({
      next: (timesheet) => {
        // Remove from pending and add to processed
        this.pendingTimesheets = this.pendingTimesheets.filter(t => t._id !== id);
        
        // Only add to processed if it fits our current filter criteria
        if (this.processedTimesheets.length < this.pageSize) {
          this.processedTimesheets = [timesheet, ...this.processedTimesheets].slice(0, this.pageSize);
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error rejecting timesheet:', err);
        this.error = 'Failed to reject timesheet. Please try again later.';
        this.loading = false;
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
    if (this.processedTimesheets.length === this.pageSize) {
      this.currentPage++;
      this.loadTimesheets();
    }
  }
  
  trackByTimesheetId(index: number, timesheet: WeeklyTimesheet): string {
    return timesheet._id || `timesheet-${index}`;
  }
  
  // Date formatting methods
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  // Add the missing formatDateShort method
  formatDateShort(dateStr?: string | null): string {
    if (!dateStr) return 'Unknown';
    
    return DateTimeUtils.formatDateForDisplay(dateStr, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}