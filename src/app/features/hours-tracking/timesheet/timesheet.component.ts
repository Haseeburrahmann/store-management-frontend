// src/app/features/hours-tracking/timesheet/timesheet.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { Subscription } from 'rxjs';

import { HoursService } from '../../../core/auth/services/hours.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { TimeSheetSummary } from '../../../core/auth/models/hours.model';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule,
    MatTableModule
  ],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex items-center mb-4">
        <button mat-icon-button routerLink="/hours">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-2xl font-bold ml-2">Timesheet</h1>
      </div>
      
      <div *ngIf="loading" class="flex justify-center py-8">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div *ngIf="!loading">
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>
              {{ timesheet?.employee_name || 'Employee' }}'s Timesheet
            </mat-card-title>
            <mat-card-subtitle>
              Week of {{ formatDate(timesheet?.week_start_date) | date:'mediumDate' }} to 
              {{ formatDate(timesheet?.week_end_date) | date:'mediumDate' }}
            </mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <form [formGroup]="dateForm" class="flex items-end gap-4 mt-4">
              <mat-form-field>
                <mat-label>Week Starting</mat-label>
                <input matInput [matDatepicker]="weekPicker" formControlName="week_start">
                <mat-datepicker-toggle matSuffix [for]="weekPicker"></mat-datepicker-toggle>
                <mat-datepicker #weekPicker></mat-datepicker>
              </mat-form-field>
              
              <button 
                mat-raised-button 
                color="primary" 
                (click)="loadTimesheet()"
                [disabled]="!dateForm.valid"
              >
                Load Timesheet
              </button>
            </form>
            
            <mat-divider class="my-4"></mat-divider>
            
            <div *ngIf="timesheet" class="mt-4">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div class="bg-blue-50 p-4 rounded shadow-sm">
                  <h3 class="text-lg font-medium text-blue-800">Total Hours</h3>
                  <p class="text-2xl font-bold text-blue-900">{{ timesheet.total_hours.toFixed(2) }}</p>
                </div>
                
                <div class="bg-green-50 p-4 rounded shadow-sm">
                  <h3 class="text-lg font-medium text-green-800">Approved Hours</h3>
                  <p class="text-2xl font-bold text-green-900">{{ timesheet.approved_hours.toFixed(2) }}</p>
                </div>
                
                <div class="bg-amber-50 p-4 rounded shadow-sm">
                  <h3 class="text-lg font-medium text-amber-800">Pending Hours</h3>
                  <p class="text-2xl font-bold text-amber-900">{{ timesheet.pending_hours.toFixed(2) }}</p>
                </div>
              </div>
              
              <h3 class="text-lg font-medium mb-3">Daily Breakdown</h3>
              
              <table class="w-full border-collapse">
                <thead>
                  <tr class="bg-gray-100">
                    <th class="p-2 text-left">Day</th>
                    <th class="p-2 text-right">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let day of getDailyHours()" 
                      class="border-b border-gray-200 hover:bg-gray-50">
                    <td class="p-2">{{ formatDate(day.date) | date:'EEEE, MMM d' }}</td>
                    <td class="p-2 text-right">{{ day.hours.toFixed(2) }}</td>
                  </tr>
                  <tr *ngIf="getDailyHours().length === 0">
                    <td colspan="2" class="p-2 text-center text-gray-500">No hours recorded for this week</td>
                  </tr>
                  <tr class="bg-gray-100 font-medium">
                    <td class="p-2">Total</td>
                    <td class="p-2 text-right">{{ timesheet.total_hours.toFixed(2) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div *ngIf="!timesheet" class="text-center py-8 text-gray-500">
              No timesheet data available for the selected week.
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: []
})
export class TimesheetComponent implements OnInit, OnDestroy {
  timesheet: TimeSheetSummary | null = null;
  dateForm: FormGroup;
  loading = false;
  employeeId: string = '';
  currentUserId: string = '';
  
  private userSubscription: Subscription | null = null;
  
  constructor(
    private fb: FormBuilder,
    private hoursService: HoursService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private snackBar: MatSnackBar
  ) {
    this.dateForm = this.fb.group({
      week_start: [this.getStartOfWeek()]
    });
  }
  
  ngOnInit(): void {
    this.loading = true;
    
    // Subscribe to user observable to get current user ID
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUserId = user._id;
        
        // Process route parameters after we have the current user ID
        this.processRouteParams();
      }
    });
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  processRouteParams(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('employeeId');
      if (id) {
        this.employeeId = id;
        this.loadTimesheet();
      } else {
        // If no employee ID provided, use current user
        if (this.currentUserId) {
          this.employeeId = this.currentUserId;
          this.loadTimesheet();
        } else {
          this.snackBar.open('No employee selected for timesheet', 'Close', { duration: 3000 });
          this.loading = false;
        }
      }
    });
  }
  
  loadTimesheet(): void {
    if (!this.employeeId) return;
    
    this.loading = true;
    const weekStart = this.dateForm.get('week_start')?.value || this.getStartOfWeek();
    
    this.hoursService.getTimesheet(this.employeeId, weekStart).subscribe({
      next: (timesheet) => {
        this.timesheet = timesheet;
        this.loading = false;
      },
      error: (error) => {
        this.snackBar.open('Error loading timesheet', 'Close', { duration: 3000 });
        this.loading = false;
        this.timesheet = null;
      }
    });
  }
  
  getStartOfWeek(): Date {
    const date = new Date();
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
    
    const monday = new Date(date.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    
    return monday;
  }
  
  getDailyHours(): {date: Date, hours: number}[] {
    if (!this.timesheet) return [];
    
    return Object.entries(this.timesheet.daily_hours)
      .map(([dateStr, hours]) => ({
        date: new Date(dateStr),
        hours
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
  
  formatDate(date: string | Date | undefined): Date {
    if (!date) return new Date();
    return new Date(date);
  }
}