// src/app/features/timesheets/timesheet-detail/timesheet-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HoursService } from '../../../core/services/hours.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { PermissionService } from '../../../core/auth/permission.service';
import { WeeklyTimesheet } from '../../../shared/models/hours.model';
import { DateTimeUtils } from '../../../core/utils/date-time-utils.service';
import { IdUtils } from '../../../core/utils/id-utils.service';
import { ErrorHandlingService } from '../../../core/utils/error-handling.service';

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
  stores: any[] = [];
  selectedStoreId = '';
  
  // For editing
  days: EditableDay[] = [];
  timesheetNotes = '';
  
  // Date calculation helpers
  weekDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  weekDayDates: Date[] = [];
  
  constructor(
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private permissionService: PermissionService,
    private route: ActivatedRoute,
    private router: Router
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
      },
      error: (err) => {
        console.error('Error loading stores:', err);
      }
    });
  }
  
  loadCurrentTimesheet(): void {
    this.hoursService.getCurrentTimesheet().subscribe({
      next: (timesheet) => {
        this.timesheet = timesheet;
        if (timesheet) {
          this.setupDaysArray();
          this.calculateWeekDayDates(timesheet.week_start_date);
          this.timesheetNotes = timesheet.notes || '';
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading current timesheet:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  loadTimesheet(id: string): void {
    this.hoursService.getTimesheet(id).subscribe({
      next: (timesheet) => {
        this.timesheet = timesheet;
        this.setupDaysArray();
        this.calculateWeekDayDates(timesheet.week_start_date);
        this.timesheetNotes = timesheet.notes || '';
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading timesheet:', err);
        this.error = ErrorHandlingService.getErrorMessage(err);
        this.loading = false;
      }
    });
  }
  
  setupDaysArray(): void {
    if (!this.timesheet) return;
    
    this.days = this.weekDays.map(day => ({
      key: day,
      name: this.formatDayName(day),
      hours: this.timesheet?.daily_hours[day as keyof typeof this.timesheet.daily_hours] || 0,
      isEditing: false
    }));
  }
  
  calculateWeekDayDates(startDateStr: string): void {
    const startDate = new Date(startDateStr);
    this.weekDayDates = DateTimeUtils.getWeekDays(startDate);
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
        this.timesheet = timesheet;
        this.setupDaysArray();
        this.calculateWeekDayDates(timesheet.week_start_date);
        this.timesheetNotes = timesheet.notes || '';
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