// src/app/features/timesheets/timesheet-detail/timesheet-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { WeeklyTimesheet, TimesheetUtils } from '../../../shared/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { IdUtils } from '../../../core/utils/id-utils.service';
import { ErrorHandlingService } from '../../../core/utils/error-handling.service';
import { Payment } from '../../../shared/models/payment.model';
import { PaymentService } from '../../../core/services/payment.service';

interface EditableDay {
  name: string;
  key: string;
  hours: number;
  isEditing: boolean;
}

@Component({
  selector: 'app-timesheet-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './timesheet-detail.component.html'
})
export class TimesheetDetailComponent implements OnInit {
  loading = true;
  error = '';
  timesheetId = '';
  isCurrentTimesheet = false;
  timesheet: WeeklyTimesheet | null = null;
  
  // For new timesheet creation
  stores: Store[] = [];
  selectedStoreId = '';
  
  // For editing
  days: EditableDay[] = [];
  timesheetNotes = '';
  
  // Date calculation helpers
  weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  weekDayDates: Date[] = [];
  
  // No timesheet handling improvement
  noTimesheetMessage = '';
  payment: Payment | null = null;
  loadingPayment = false;
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router,
    private paymentService: PaymentService
  ) {}
  
  ngOnInit(): void {
    // Check if this is the "current" timesheet view
    this.isCurrentTimesheet = this.route.snapshot.data['isCurrent'] === true;
    
    if (this.isCurrentTimesheet) {
      this.loadCurrentTimesheet();
    } else {
      this.timesheetId = this.route.snapshot.paramMap.get('id') || '';
      if (!this.timesheetId) {
        this.error = 'No timesheet ID provided';
        this.loading = false;
        return;
      }
      this.loadTimesheet(this.timesheetId);
    }
    
    // Load stores for the new timesheet form
    this.loadStores();
  }
  
  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores) => {
        this.stores = stores;
        console.log(`Loaded ${stores.length} stores`);
        
        // If we already have a timesheet, ensure store name is set
        if (this.timesheet && !this.timesheet.store_name && this.timesheet.store_id) {
          const store = this.stores.find(s => s._id === this.timesheet?.store_id);
          if (store) {
            this.timesheet.store_name = store.name;
          }
        }
        
        // If there's only one store, pre-select it for new timesheet creation
        if (stores.length === 1 && !this.selectedStoreId) {
          this.selectedStoreId = stores[0]._id;
        }
      },
      error: (err) => {
        console.error('Error loading stores:', err);
        this.error = 'Failed to load stores. Please try again later.';
        this.loading = false;
      }
    });
  }
  
  /**
   * Enhanced loadCurrentTimesheet method with proper no timesheet handling
   */
  loadCurrentTimesheet(): void {
    console.log('Loading current timesheet');
    this.hoursService.getCurrentTimesheet().subscribe({
      next: (timesheet) => {
        console.log('Current timesheet response:', timesheet ? 'Found' : 'Not found');
        this.timesheet = timesheet;
        
        if (timesheet) {
          this.setupDaysArray();
          this.calculateWeekDayDates(timesheet.week_start_date);
          this.timesheetNotes = timesheet.notes || '';
          
          // Ensure store name is populated
          if (!timesheet.store_name && timesheet.store_id) {
            const store = this.stores.find(s => s._id === timesheet.store_id);
            if (store) {
              timesheet.store_name = store.name;
            }
          }
          
          // Load payment if this timesheet is associated with one
          if (timesheet.payment_id) {
            this.loadPayment(timesheet.payment_id);
          }
        } else {
          // Improved no timesheet handling
          this.noTimesheetMessage = 'You don\'t have a timesheet for the current week. You can start a new one by selecting a store below.';
        }
        this.loading = false;
      },
      error: (err) => {
        // This case should be handled in the service now, but keeping as fallback
        console.error('Error loading current timesheet:', err);
        this.noTimesheetMessage = 'You don\'t have a timesheet for the current week. You can start a new one by selecting a store below.';
        this.timesheet = null;
        this.error = '';
        this.loading = false;
      }
    });
  }
  
  loadTimesheet(id: string): void {
    console.log(`Loading timesheet with ID: ${id}`);
    this.hoursService.getTimesheet(id).subscribe({
      next: (timesheet) => {
        console.log('Timesheet loaded successfully:', timesheet._id);
        this.timesheet = timesheet;
        this.setupDaysArray();
        this.calculateWeekDayDates(timesheet.week_start_date);
        this.timesheetNotes = timesheet.notes || '';
        
        // Ensure store name is populated
        if (!timesheet.store_name && timesheet.store_id) {
          const store = this.stores.find(s => s._id === timesheet.store_id);
          if (store) {
            timesheet.store_name = store.name;
          }
        }
        
        // Load payment if this timesheet is associated with one
        if (timesheet.payment_id) {
          this.loadPayment(timesheet.payment_id);
        }
        
        this.loading = false;
      },
      error: (err) => {
        // Handle 404 case specifically
        if (err.status === 404) {
          console.error(`Timesheet with ID ${id} not found`);
          this.noTimesheetMessage = 'The requested timesheet could not be found.';
          this.timesheet = null;
          this.error = '';
        } else {
          console.error('Error loading timesheet:', err);
          this.error = ErrorHandlingService.getErrorMessage(err);
        }
        this.loading = false;
      }
    });
  }
  
  loadPayment(paymentId: string): void {
    this.loadingPayment = true;
    
    this.paymentService.getPayment(paymentId).subscribe({
      next: (data) => {
        this.payment = data;
        this.loadingPayment = false;
      },
      error: (error) => {
        console.error('Error loading payment', error);
        this.loadingPayment = false;
      }
    });
  }
  
  setupDaysArray(): void {
    if (!this.timesheet) return;
    
    // Use TimesheetUtils to make sure the timesheet is complete
    // This will handle missing daily_hours and other fields
    this.timesheet = TimesheetUtils.ensureComplete(this.timesheet);
    
    this.days = this.weekDays.map(day => ({
      key: day,
      name: this.formatDayName(day),
      hours: TimesheetUtils.getDayHours(this.timesheet, day),
      isEditing: false
    }));
  }
  
  calculateWeekDayDates(startDateStr: string): void {
    try {
      const startDate = new Date(startDateStr);
      if (isNaN(startDate.getTime())) {
        console.error(`Invalid start date: ${startDateStr}`);
        this.weekDayDates = [];
        return;
      }
      this.weekDayDates = DateTimeUtils.getWeekDays(startDate);
    } catch (error) {
      console.error(`Error calculating week days: ${error}`);
      this.weekDayDates = [];
    }
  }
  
  get canEditTimesheet(): boolean {
    if (!this.timesheet) return false;
    
    // Can edit if the timesheet is in draft or rejected status
    return ['draft', 'rejected'].includes(this.timesheet.status);
  }
  
  get canApproveTimesheet(): boolean {
    return this.permissionService.hasPermission('hours:approve');
  }
  
  startNewTimesheet(): void {
    if (!this.selectedStoreId) {
      alert('Please select a store for the timesheet');
      return;
    }
    
    this.loading = true;
    
    this.hoursService.startNewTimesheet(this.selectedStoreId).subscribe({
      next: (timesheet) => {
        console.log(`New timesheet created with ID: ${timesheet._id}`);
        this.timesheet = timesheet;
        this.setupDaysArray();
        this.calculateWeekDayDates(timesheet.week_start_date);
        this.timesheetNotes = timesheet.notes || '';
        
        // Ensure store name is populated
        if (!timesheet.store_name && timesheet.store_id) {
          const store = this.stores.find(s => s._id === timesheet.store_id);
          if (store) {
            timesheet.store_name = store.name;
          }
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error creating new timesheet:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  editDay(day: EditableDay): void {
    // Reset any currently editing day
    this.days.forEach(d => {
      if (d.key !== day.key) {
        d.isEditing = false;
      }
    });
    
    // Set this day to editing mode
    day.isEditing = true;
  }
  
  cancelEdit(day: EditableDay): void {
    // Reset to original value from the timesheet
    day.hours = this.timesheet?.daily_hours[day.key as keyof typeof this.timesheet.daily_hours] || 0;
    day.isEditing = false;
  }
  
  saveDayHours(day: EditableDay): void {
    if (!this.timesheet || !this.timesheet._id) return;
    
    // Validate hours
    if (day.hours < 0 || day.hours > 24) {
      alert('Hours must be between 0 and 24');
      return;
    }
    
    this.loading = true;
    
    this.hoursService.updateDailyHours(this.timesheet._id, day.key, day.hours).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
        day.isEditing = false;
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error updating hours for ${day.key}:`, err);
        alert(ErrorHandlingService.getErrorMessage(err));
        this.loading = false;
        // Reset to original value
        day.hours = this.timesheet?.daily_hours[day.key as keyof typeof this.timesheet.daily_hours] || 0;
      }
    });
  }
  
  updateNotes(): void {
    if (!this.timesheet || !this.timesheet._id) return;
    
    this.loading = true;
    
    this.hoursService.updateTimesheet(this.timesheet._id, {
      notes: this.timesheetNotes
    }).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error updating notes:', err);
        alert(ErrorHandlingService.getErrorMessage(err));
        this.loading = false;
      }
    });
  }
  
  submitTimesheet(): void {
    if (!this.timesheet || !this.timesheet._id) return;
    
    this.loading = true;
    
    this.hoursService.submitTimesheet(this.timesheet._id, this.timesheetNotes).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error submitting timesheet:', err);
        alert(ErrorHandlingService.getErrorMessage(err));
        this.loading = false;
      }
    });
  }
  
  approveTimesheet(): void {
    if (!this.timesheet || !this.timesheet._id) return;
    
    this.loading = true;
    
    this.hoursService.approveTimesheet(this.timesheet._id).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error approving timesheet:', err);
        alert(ErrorHandlingService.getErrorMessage(err));
        this.loading = false;
      }
    });
  }
  
  showRejectDialog(): void {
    if (!this.timesheet || !this.timesheet._id) return;
    
    const reason = prompt('Please enter a reason for rejecting this timesheet:');
    if (!reason) return; // Cancelled
    
    this.loading = true;
    
    this.hoursService.rejectTimesheet(this.timesheet._id, reason).subscribe({
      next: (updatedTimesheet) => {
        this.timesheet = updatedTimesheet;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error rejecting timesheet:', err);
        alert(ErrorHandlingService.getErrorMessage(err));
        this.loading = false;
      }
    });
  }
  
  navigateBack(): void {
    // Use window.history to go back if possible
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Otherwise navigate to the timesheet list
      this.router.navigate(['/timesheets']);
    }
  }
  
  // Helper methods
  formatDayName(day: string): string {
    return day.charAt(0).toUpperCase() + day.slice(1);
  }
  
  getDateForDay(day: string): string {
    const dayIndex = this.weekDays.indexOf(day);
    if (dayIndex === -1 || this.weekDayDates.length === 0) return '';
    
    return DateTimeUtils.formatDateForDisplay(this.weekDayDates[dayIndex].toISOString());
  }
  
  formatDate(dateStr: string): string {
    return DateTimeUtils.formatDateForDisplay(dateStr);
  }
  
  formatDateTime(dateStr?: string): string {
    if (!dateStr) return '';
    return DateTimeUtils.formatDateForDisplay(dateStr, { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}