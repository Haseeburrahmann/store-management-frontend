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
  pageSize = 5;
  totalTimesheets = 0;
  
  // Filters
  storeFilter = '';
  statusFilter = '';
  dateRangeFilter = 'past-month';
  startDate = '';
  endDate = '';
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private router: Router
  ) {}
  
  ngOnInit(): void {
    this.loadStores();
    this.applyDateRangeFilter(); // Sets default date range
    this.loadCurrentTimesheet();
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
  
  loadCurrentTimesheet(): void {
    this.hoursService.getCurrentTimesheet().subscribe({
      next: (timesheet) => {
        this.currentTimesheet = timesheet;
      },
      error: (err) => {
        console.error('Error loading current timesheet:', err);
      }
    });
  }
  
  loadTimesheets(): void {
    this.loading = true;
    
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
    
    this.hoursService.getMyTimesheets(options).subscribe({
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