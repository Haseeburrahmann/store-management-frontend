// src/app/features/dashboard/widgets/hours-stats-widget/hours-stats-widget.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HoursService } from '../../../../core/services/hours.service';
import { AuthService } from '../../../../core/auth/auth.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { IdUtils } from '../../../../core/utils/id-utils.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-hours-stats-widget',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="bg-white dark:bg-slate-800 rounded-lg shadow-md overflow-hidden">
      <div class="p-5">
        <div class="flex items-center">
          <div class="flex-shrink-0 bg-cyan-100 dark:bg-cyan-900 rounded-md p-3">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-cyan-600 dark:text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">Hours This Week</dt>
              <dd class="flex items-baseline">
                <div *ngIf="!loading" class="text-2xl font-semibold text-slate-900 dark:text-white">{{ totalHours.toFixed(1) }}</div>
                <div *ngIf="loading" class="text-2xl font-semibold text-slate-400 dark:text-slate-500">...</div>
                <div *ngIf="!loading && percentChange !== 0" class="ml-2 flex items-baseline text-sm font-semibold" 
                     [ngClass]="percentChange > 0 ? 'text-green-600 dark:text-green-500' : 'text-red-600 dark:text-red-500'">
                  <svg *ngIf="percentChange > 0" class="w-5 h-5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                  </svg>
                  <svg *ngIf="percentChange < 0" class="w-5 h-5 fill-current" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                  <span class="sr-only">{{ percentChange > 0 ? 'Increased' : 'Decreased' }} by</span>
                  {{ Math.abs(percentChange).toFixed(0) }}%
                </div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      <div class="bg-slate-50 dark:bg-slate-700 px-5 py-3">
        <div class="text-sm">
          <a routerLink="/hours" class="font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">View timesheet</a>
        </div>
      </div>
    </div>
  `
})
export class HoursStatsWidgetComponent implements OnInit {
  loading = true;
  totalHours = 0;
  percentChange = 0;
  Math = Math; // To use Math in the template
  
  constructor(
    private hoursService: HoursService,
    private authService: AuthService,
    private permissionService: PermissionService
  ) {}
  
  ngOnInit(): void {
    // Only load data if user has permission to view hours
    if (this.permissionService.hasPermission('hours:read')) {
      this.loadHoursStats();
    } else {
      this.loading = false;
    }
  }
  
  loadHoursStats(): void {
    console.log('Loading hours stats');
    
    // Get current user or all employees based on role
    const isAdmin = this.permissionService.isAdmin();
    const isManager = this.permissionService.isManager();
    
    // Get current and previous week date ranges
    const currentWeekDates = this.getWeekDateRange(0);
    const previousWeekDates = this.getWeekDateRange(-1);
    
    if (isAdmin || isManager) {
      // For admins and managers, get all hours for their scope
      console.log('Loading hours for admin/manager view');
      this.loadAllHours(currentWeekDates, previousWeekDates);
    } else {
      // For regular employees, get the employee ID from the current user
      console.log('Getting employee ID for regular employee view');
      this.hoursService.getCurrentEmployeeId().subscribe({
        next: (employeeId) => {
          if (employeeId) {
            console.log('Found employee ID:', employeeId);
            // Use the employee ID instead of user ID
            this.loadEmployeeHours(employeeId, currentWeekDates, previousWeekDates);
          } else {
            console.log('No employee record found for current user');
            this.loading = false;
          }
        },
        error: (err) => {
          console.error('Error getting current employee ID:', err);
          this.loading = false;
        }
      });
    }
  }
  
  loadAllHours(currentWeekDates: { start: string, end: string }, previousWeekDates: { start: string, end: string }): void {
    console.log('Loading all hours for date range:', currentWeekDates);
    
    // For managers and admins, load all time entries they have access to
    // For managers, this might be filtered by store in a real implementation
    const currentRequest = this.hoursService.getTimeEntries({
      start_date: currentWeekDates.start,
      end_date: currentWeekDates.end
    }).pipe(
      catchError(err => {
        console.error('Error loading current week hours:', err);
        return of([]);
      })
    );
    
    const previousRequest = this.hoursService.getTimeEntries({
      start_date: previousWeekDates.start,
      end_date: previousWeekDates.end
    }).pipe(
      catchError(err => {
        console.error('Error loading previous week hours:', err);
        return of([]);
      })
    );
    
    // Use forkJoin to make both requests simultaneously
    forkJoin({
      current: currentRequest,
      previous: previousRequest
    }).subscribe({
      next: (results) => {
        const currentHours = this.calculateTotalHours(results.current);
        const previousHours = this.calculateTotalHours(results.previous);
        
        console.log(`Calculated hours - Current: ${currentHours}, Previous: ${previousHours}`);
        
        this.totalHours = currentHours;
        
        // Calculate percent change
        if (previousHours > 0) {
          this.percentChange = ((currentHours - previousHours) / previousHours) * 100;
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error('Error in hours calculation:', err);
        this.loading = false;
      }
    });
  }
  
  loadEmployeeHours(employeeId: string, currentWeekDates: { start: string, end: string }, previousWeekDates: { start: string, end: string }): void {
    // Ensure employeeId is string format
    const safeEmployeeId = IdUtils.ensureString(employeeId);
    console.log('Loading hours for employee ID:', safeEmployeeId);
    
    const currentRequest = this.hoursService.getTimeEntries({
      employee_id: safeEmployeeId,
      start_date: currentWeekDates.start,
      end_date: currentWeekDates.end
    }).pipe(
      catchError(err => {
        console.error(`Error loading current week hours for employee ${safeEmployeeId}:`, err);
        return of([]);
      })
    );
    
    const previousRequest = this.hoursService.getTimeEntries({
      employee_id: safeEmployeeId,
      start_date: previousWeekDates.start,
      end_date: previousWeekDates.end
    }).pipe(
      catchError(err => {
        console.error(`Error loading previous week hours for employee ${safeEmployeeId}:`, err);
        return of([]);
      })
    );
    
    // Use forkJoin to make both requests simultaneously
    forkJoin({
      current: currentRequest,
      previous: previousRequest
    }).subscribe({
      next: (results) => {
        const currentHours = this.calculateTotalHours(results.current);
        const previousHours = this.calculateTotalHours(results.previous);
        
        console.log(`Calculated hours for employee ${safeEmployeeId} - Current: ${currentHours}, Previous: ${previousHours}`);
        
        this.totalHours = currentHours;
        
        // Calculate percent change
        if (previousHours > 0) {
          this.percentChange = ((currentHours - previousHours) / previousHours) * 100;
        }
        
        this.loading = false;
      },
      error: (err) => {
        console.error(`Error in hours calculation for employee ${safeEmployeeId}:`, err);
        this.loading = false;
      }
    });
  }
  
  calculateTotalHours(entries: any[]): number {
    return entries.reduce((total, entry) => {
      // If total_minutes is available, use it
      if (entry.total_minutes) {
        return total + (entry.total_minutes / 60);
      }
      
      // Otherwise calculate from clock in/out if both exist
      if (entry.clock_in && entry.clock_out) {
        const clockIn = new Date(entry.clock_in);
        const clockOut = new Date(entry.clock_out);
        const durationHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60);
        return total + durationHours;
      }
      
      return total;
    }, 0);
  }
  
  getWeekDateRange(weekOffset: number = 0): { start: string, end: string } {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Calculate the date of Sunday (start of week)
    const sunday = new Date(now);
    sunday.setDate(now.getDate() - currentDay + (weekOffset * 7));
    sunday.setHours(0, 0, 0, 0);
    
    // Calculate the date of Saturday (end of week)
    const saturday = new Date(sunday);
    saturday.setDate(sunday.getDate() + 6);
    saturday.setHours(23, 59, 59, 999);
    
    return {
      start: sunday.toISOString().split('T')[0],
      end: saturday.toISOString().split('T')[0]
    };
  }
}