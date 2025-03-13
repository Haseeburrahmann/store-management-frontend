// src/app/features/timesheets/timesheet-list/timesheet-list.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { WeeklyTimesheet } from '../../../shared/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { HasPermissionDirective } from '../../../shared/directives/has-permission.directive';
import { EmployeeService } from '../../../core/services/employee.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-timesheet-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HasPermissionDirective],
  templateUrl: './timesheet-list.component.html'
})
export class TimesheetListComponent implements OnInit {
  loading = true;
  timesheets: WeeklyTimesheet[] = [];
  currentTimesheet: WeeklyTimesheet | null = null;
  stores: Store[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 10; // Increased from 5 to show more results
  totalTimesheets = 0;
  
  // Filters
  storeFilter = '';
  statusFilter = '';
  dateRangeFilter = 'past-month';
  startDate = '';
  endDate = '';
  
  // Error handling
  error = '';
  noTimesheetsMessage = 'No timesheets found matching your filters.';
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private employeeService: EmployeeService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.applyDateRangeFilter(); // Sets default date range
    // Load stores first, then load timesheets after stores are available
    this.loadStoresAndTimesheets();
  }
  
  loadStoresAndTimesheets(): void {
    this.loading = true;
    
    // First, load the stores
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        console.log(`Loaded ${stores.length} stores`);
        
        // Now that stores are loaded, get timesheets and current timesheet
        forkJoin({
          current: this.hoursService.getCurrentTimesheet(),
          history: this.loadTimesheetsData()
        }).subscribe({
          next: (results) => {
            // Process current timesheet
            if (results.current) {
              this.currentTimesheet = results.current;
              this.enrichTimesheetData(this.currentTimesheet);
            }
            
            // Process history timesheets
            if (results.history && Array.isArray(results.history)) {
              console.log(`Loaded ${results.history.length} timesheets`);
              
              // Enrich with store and employee names if missing
              results.history.forEach(timesheet => this.enrichTimesheetData(timesheet));
              
              this.timesheets = results.history;
              
              // Calculate pagination information
              this.calculatePagination(results.history);
            }
            
            // Update loading state
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading timesheet data:', err);
            this.error = 'Failed to load timesheet data. Please try again later.';
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = 'Could not load stores. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  loadTimesheetsData() {
    const options: any = {
      skip: (this.currentPage - 1) * this.pageSize,
      limit: this.pageSize
    };
    
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
    
    console.log('Loading timesheets with options:', options);
    
    return this.hoursService.getMyTimesheets(options);
  }
  
  loadTimesheets(): void {
    this.loading = true;
    this.error = '';
    
    this.loadTimesheetsData().subscribe({
      next: (timesheets) => {
        console.log(`Loaded ${timesheets.length} timesheets`);
        
        // Enrich with store and employee names if missing
        timesheets.forEach(timesheet => this.enrichTimesheetData(timesheet));
        
        this.timesheets = timesheets;
        
        // Calculate pagination information
        this.calculatePagination(timesheets);
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading timesheets:', err);
        this.error = 'Failed to load timesheets. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  // Helper method to calculate pagination info
  calculatePagination(timesheets: WeeklyTimesheet[]): void {
    // For real pagination, we would get the total count from the API
    // For now, we'll estimate based on the returned results
    if (timesheets.length === this.pageSize) {
      // If we got a full page, there are probably more
      this.totalTimesheets = (this.currentPage * this.pageSize) + 1;
    } else if (timesheets.length > 0) {
      // If we got a partial page, this is the last page
      this.totalTimesheets = ((this.currentPage - 1) * this.pageSize) + timesheets.length;
    } else if (this.currentPage > 1) {
      // If we got no results but we're past page 1, we've gone too far
      this.totalTimesheets = (this.currentPage - 1) * this.pageSize;
      this.currentPage--; // Go back to the previous page
      this.loadTimesheets(); // Reload with the correct page
      return;
    } else {
      // If we're on page 1 with no results, there are no results
      this.totalTimesheets = 0;
      this.noTimesheetsMessage = 'No timesheets found matching your filters.';
    }
  }
  
  // Helper method to add missing names to timesheet objects if needed
  enrichTimesheetData(timesheet: WeeklyTimesheet): void {
    // Add store name if missing
    if (!timesheet.store_name && timesheet.store_id) {
      const store = this.stores.find(s => s._id === timesheet.store_id);
      if (store) {
        timesheet.store_name = store.name;
        console.log(`Added store name ${store.name} to timesheet`);
      } else {
        console.warn(`Could not find store with ID ${timesheet.store_id} in stores list`);
      }
    }
    
    // Add employee name if missing
    if (!timesheet.employee_name && this.authService.currentUser) {
      timesheet.employee_name = this.authService.currentUser.full_name || 
                              this.authService.currentUser.email;
    }
    
    // Ensure total_earnings is a number (in case it's coming as string from API)
    if (typeof timesheet.total_earnings === 'string') {
      timesheet.total_earnings = parseFloat(timesheet.total_earnings);
    }
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
    
    // Only load timesheets if the stores are already loaded
    if (this.stores.length > 0) {
      this.loadTimesheets();
    }
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
  
  trackByTimesheetId(index: number, timesheet: WeeklyTimesheet): string {
    return timesheet._id || `timesheet-${index}`;
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
}