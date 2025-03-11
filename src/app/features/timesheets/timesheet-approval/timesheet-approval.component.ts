// src/app/features/timesheets/timesheet-approval/timesheet-approval.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { EmployeeService } from '../../../core/services/employee.service';
import { WeeklyTimesheet } from '../../../shared/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { Employee } from '../../../shared/models/employee.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';

@Component({
  selector: 'app-timesheet-approval',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl:'./timesheet-approval.component.html'
   
})
export class TimesheetApprovalComponent implements OnInit {
  loading = true;
  pendingTimesheets: WeeklyTimesheet[] = [];
  processedTimesheets: WeeklyTimesheet[] = [];
  stores: Store[] = [];
  employees: Employee[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 5;
  
  // Filters
  employeeFilter = '';
  storeFilter = '';
  dateRangeFilter = 'past-month';
  startDate = '';
  endDate = '';
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadStores();
    this.loadEmployees();
    this.applyDateRangeFilter(); // Sets default date range
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
    
    // Common filter options
    const filterOptions: any = {};
    
    if (this.employeeFilter) {
      filterOptions.employee_id = this.employeeFilter;
    }
    
    if (this.storeFilter) {
      filterOptions.store_id = this.storeFilter;
    }
    
    if (this.startDate) {
      filterOptions.start_date = this.startDate;
    }
    
    if (this.endDate) {
      filterOptions.end_date = this.endDate;
    }
    
    // Load pending timesheets (status = 'submitted')
    const pendingOptions = { 
      ...filterOptions,
      status: 'submitted',
      limit: 100 // Get all pending timesheets
    };
    
    this.hoursService.getTimesheets(pendingOptions).subscribe({
      next: (timesheets) => {
        this.pendingTimesheets = timesheets;
        
        // Now load processed timesheets (approved or rejected)
        this.loadProcessedTimesheets(filterOptions);
      },
      error: (err) => {
        console.error('Error loading pending timesheets:', err);
        this.loading = false;
        // Still try to load processed timesheets
        this.loadProcessedTimesheets(filterOptions);
      }
    });
  }
  
  loadProcessedTimesheets(filterOptions: any): void {
    // For processed timesheets, get both approved and rejected
    // We'll handle pagination here
    const processedOptions = {
      ...filterOptions,
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
    // First try approved timesheets
    this.hoursService.getTimesheets({
      ...processedOptions,
      status: 'approved'
    }).subscribe({
      next: (approvedTimesheets) => {
        // Then get rejected timesheets
        this.hoursService.getTimesheets({
          ...processedOptions,
          status: 'rejected'
        }).subscribe({
          next: (rejectedTimesheets) => {
            // Combine and sort by approved_at date (newest first)
            this.processedTimesheets = [...approvedTimesheets, ...rejectedTimesheets]
              .sort((a, b) => {
                const dateA = a.approved_at ? new Date(a.approved_at).getTime() : 0;
                const dateB = b.approved_at ? new Date(b.approved_at).getTime() : 0;
                return dateB - dateA;
              })
              .slice(0, this.pageSize); // Only take pageSize items
            
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading rejected timesheets:', err);
            // Just use approved timesheets
            this.processedTimesheets = approvedTimesheets;
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading approved timesheets:', err);
        this.processedTimesheets = [];
        this.loading = false;
      }
    });
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
    
    this.loadTimesheets();
  }
  
  approveTimesheet(timesheetId: string): void {
    if (!timesheetId) return;
    
    this.loading = true;
    
    this.hoursService.approveTimesheet(timesheetId).subscribe({
      next: (updatedTimesheet) => {
        // Remove from pending and add to processed
        this.pendingTimesheets = this.pendingTimesheets.filter(t => t._id !== timesheetId);
        this.processedTimesheets = [updatedTimesheet, ...this.processedTimesheets.slice(0, this.pageSize - 1)];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error approving timesheet:', err);
        alert('Error approving timesheet: ' + err.message);
        this.loading = false;
      }
    });
  }
  
  rejectTimesheet(timesheetId: string): void {
    if (!timesheetId) return;
    
    const reason = prompt('Please enter a reason for rejecting this timesheet:');
    if (!reason) return; // Cancelled
    
    this.loading = true;
    
    this.hoursService.rejectTimesheet(timesheetId, reason).subscribe({
      next: (updatedTimesheet) => {
        // Remove from pending and add to processed
        this.pendingTimesheets = this.pendingTimesheets.filter(t => t._id !== timesheetId);
        this.processedTimesheets = [updatedTimesheet, ...this.processedTimesheets.slice(0, this.pageSize - 1)];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error rejecting timesheet:', err);
        alert('Error rejecting timesheet: ' + err.message);
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
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  formatDateShort(dateStr?: string): string {
    if (!dateStr) return '';
    return DateTimeUtils.formatDateForDisplay(dateStr, { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}