// src/app/features/hours-tracking/hours-detail/hours-detail.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { finalize, Subscription } from 'rxjs';

// Updated import paths
import { HoursService } from '../../../core/services/hours.service';
import { AuthService } from '../../../core/services/auth.service';
import { Hours, HoursStatus, HoursUpdate } from '../../../shared/models/hours.model';
import { UserWithPermissions } from '../../../core/auth/models/user.model';

@Component({
  selector: 'app-hours-detail',
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
    MatChipsModule
  ],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex items-center mb-4">
        <button mat-icon-button routerLink="/hours">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-2xl font-bold ml-2">Hours Record Details</h1>
      </div>
      
      <div *ngIf="loading" class="flex justify-center py-8">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div *ngIf="!loading && hours">
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Record Information</mat-card-title>
            <div class="flex-grow"></div>
            <mat-chip [ngClass]="getStatusClass(hours.status)">
              {{ hours.status | titlecase }}
            </mat-chip>
          </mat-card-header>
          <mat-card-content class="pt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Employee:</strong> {{ hours.employee?.full_name || 'Unknown' }}</p>
                <p><strong>Store:</strong> {{ hours.store?.name || 'Unknown' }}</p>
                <p><strong>Date:</strong> {{ formatDate(hours.date) | date:'mediumDate' }}</p>
              </div>
              <div>
                <p><strong>Clock In:</strong> {{ formatDate(hours.clock_in) | date:'shortTime' }}</p>
                <p><strong>Clock Out:</strong> {{ hours.clock_out ? (formatDate(hours.clock_out) | date:'shortTime') : 'Active' }}</p>
                <p><strong>Total Hours:</strong> {{ calculateTotalHours() }}</p>
              </div>
            </div>
            
            <div *ngIf="hours.break_start || hours.break_end" class="mt-4">
              <p><strong>Break:</strong> 
                {{ hours.break_start ? (formatDate(hours.break_start) | date:'shortTime') : 'N/A' }} - 
                {{ hours.break_end ? (formatDate(hours.break_end) | date:'shortTime') : 'N/A' }}
              </p>
            </div>
            
            <div *ngIf="hours.notes" class="mt-4">
              <p><strong>Notes:</strong></p>
              <p class="bg-gray-50 p-3 rounded">{{ hours.notes }}</p>
            </div>
            
            <div *ngIf="hours.status !== HoursStatus.PENDING" class="mt-4">
              <p><strong>{{ hours.status === HoursStatus.APPROVED ? 'Approved' : 'Rejected' }} By:</strong> 
                {{ hours.approved_by || 'Unknown' }}
              </p>
              <p><strong>{{ hours.status === HoursStatus.APPROVED ? 'Approved' : 'Rejected' }} On:</strong> 
                {{ hours.approved_at ? (formatDate(hours.approved_at) | date:'medium') : 'Unknown' }}
              </p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card *ngIf="canEdit && hours.status === HoursStatus.PENDING">
          <mat-card-header>
            <mat-card-title>Edit Hours Record</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="editForm" (ngSubmit)="onSubmit()">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <mat-form-field>
                  <mat-label>Clock Out Time</mat-label>
                  <input matInput [matDatepicker]="clockOutPicker" formControlName="clock_out">
                  <mat-datepicker-toggle matSuffix [for]="clockOutPicker"></mat-datepicker-toggle>
                  <mat-datepicker #clockOutPicker></mat-datepicker>
                </mat-form-field>
                
                <div></div>
                
                <mat-form-field>
                  <mat-label>Break Start Time</mat-label>
                  <input matInput [matDatepicker]="breakStartPicker" formControlName="break_start">
                  <mat-datepicker-toggle matSuffix [for]="breakStartPicker"></mat-datepicker-toggle>
                  <mat-datepicker #breakStartPicker></mat-datepicker>
                </mat-form-field>
                
                <mat-form-field>
                  <mat-label>Break End Time</mat-label>
                  <input matInput [matDatepicker]="breakEndPicker" formControlName="break_end">
                  <mat-datepicker-toggle matSuffix [for]="breakEndPicker"></mat-datepicker-toggle>
                  <mat-datepicker #breakEndPicker></mat-datepicker>
                </mat-form-field>
              </div>
              
              <div class="mt-4">
                <mat-form-field class="w-full">
                  <mat-label>Notes</mat-label>
                  <textarea matInput formControlName="notes" rows="3"></textarea>
                </mat-form-field>
              </div>
              
              <div class="flex justify-end gap-3 mt-4">
                <button 
                  mat-button
                  type="button"
                  (click)="resetForm()"
                >
                  Reset
                </button>
                
                <button 
                  mat-raised-button 
                  color="primary"
                  type="submit" 
                  [disabled]="!editForm.valid || submitting || !editForm.dirty"
                >
                  <span *ngIf="!submitting">Save Changes</span>
                  <mat-spinner *ngIf="submitting" diameter="24" class="inline-block"></mat-spinner>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
        
        <div class="flex justify-between mt-6" *ngIf="hours.status === HoursStatus.PENDING">
          <div>
            <button 
              mat-raised-button 
              color="warn" 
              *ngIf="canDelete"
              (click)="deleteHours()"
            >
              Delete Record
            </button>
          </div>
          
          <div>
            <button 
              mat-raised-button 
              color="primary" 
              *ngIf="canApprove"
              [routerLink]="['/hours/approval']" 
              [queryParams]="{id: hours._id}"
            >
              Approve/Reject
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pending-chip { background-color: #FEF3C7; color: #92400E; }
    .approved-chip { background-color: #D1FAE5; color: #065F46; }
    .rejected-chip { background-color: #FEE2E2; color: #B91C1C; }
  `]
})
export class HoursDetailComponent implements OnInit, OnDestroy {
  hours: Hours | null = null;
  editForm: FormGroup;
  loading = false;
  submitting = false;
  canEdit = false;
  canDelete = false;
  canApprove = false;
  currentUserId = '';
  
  // Expose enum to template
  HoursStatus = HoursStatus;
  
  private userSubscription: Subscription | null = null;
  
  constructor(
    private fb: FormBuilder,
    private hoursService: HoursService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.editForm = this.fb.group({
      clock_out: [null],
      break_start: [null],
      break_end: [null],
      notes: ['']
    });
  }
  
  ngOnInit(): void {
    this.loading = true;
    
    // Subscribe to current user
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUserId = user._id;
      }
    });
    
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.loadHoursRecord(id);
      } else {
        this.snackBar.open('No hours record ID provided', 'Close', { duration: 3000 });
        this.router.navigate(['/hours']);
      }
    });
    
    // Check permissions
    this.canApprove = this.authService.hasPermission('hours', 'approve');
    this.canDelete = this.authService.hasPermission('hours', 'delete');
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  loadHoursRecord(id: string): void {
    this.hoursService.getHours(id).subscribe({
      next: (hours) => {
        this.hours = hours;
        this.loading = false;
        
        // Check if user can edit this record
        this.checkEditPermission();
        
        // Populate the form
        this.editForm.patchValue({
          clock_out: hours.clock_out || null,
          break_start: hours.break_start || null,
          break_end: hours.break_end || null,
          notes: hours.notes || ''
        });
      },
      error: (error) => {
        this.snackBar.open('Error loading hours record', 'Close', { duration: 3000 });
        this.loading = false;
        this.router.navigate(['/hours']);
      }
    });
  }
  
  checkEditPermission(): void {
    if (!this.hours) return;
    
    const isAdmin = this.authService.hasPermission('users', 'approve');
    const isManager = this.authService.hasPermission('employees', 'approve') && !isAdmin;
    
    // User can edit their own hours
    if (this.hours.employee_id === this.currentUserId) {
      this.canEdit = true;
      return;
    }
    
    // Managers can edit hours for employees in their stores
    if (isManager) {
      // This would need logic to check if the employee is in the manager's store
      // For simplicity, we'll assume if they can view it, they can edit it
      this.canEdit = true;
      return;
    }
    
    // Admins can edit any hours
    if (isAdmin) {
      this.canEdit = true;
      return;
    }
    
    this.canEdit = false;
  }
  
  resetForm(): void {
    if (this.hours) {
      this.editForm.reset({
        clock_out: this.hours.clock_out || null,
        break_start: this.hours.break_start || null,
        break_end: this.hours.break_end || null,
        notes: this.hours.notes || ''
      });
    }
  }
  
  onSubmit(): void {
    if (this.editForm.valid && this.hours && this.canEdit) {
      this.submitting = true;
      
      const updateData: HoursUpdate = this.editForm.value;
      
      this.hoursService.updateHours(this.hours._id, updateData)
        .pipe(finalize(() => this.submitting = false))
        .subscribe({
          next: (result) => {
            this.snackBar.open('Hours record updated successfully', 'Close', { duration: 3000 });
            this.hours = result;
            this.resetForm();
          },
          error: (error) => {
            this.snackBar.open(error.error?.detail || 'Error updating hours record', 'Close', { duration: 3000 });
          }
        });
    }
  }
  
  deleteHours(): void {
    if (this.hours && this.canDelete && confirm('Are you sure you want to delete this hours record?')) {
      this.hoursService.deleteHours(this.hours._id).subscribe({
        next: () => {
          this.snackBar.open('Hours record deleted successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/hours']);
        },
        error: (error) => {
          this.snackBar.open(error.error?.detail || 'Error deleting hours record', 'Close', { duration: 3000 });
        }
      });
    }
  }
  
  formatDate(date: string | Date | undefined): Date {
    if (!date) return new Date();
    return new Date(date);
  }
  
  calculateTotalHours(): string {
    if (!this.hours || !this.hours.clock_in || !this.hours.clock_out) {
      return '-';
    }

    try {
      const clockIn = new Date(this.hours.clock_in);
      const clockOut = new Date(this.hours.clock_out);
      
      // Calculate difference in milliseconds
      let diffMs = clockOut.getTime() - clockIn.getTime();
      
      // Subtract break time if available
      if (this.hours.break_start && this.hours.break_end) {
        const breakStart = new Date(this.hours.break_start);
        const breakEnd = new Date(this.hours.break_end);
        const breakMs = breakEnd.getTime() - breakStart.getTime();
        diffMs -= breakMs;
      }
      
      // Convert to hours with 2 decimal places
      const hours = diffMs / (1000 * 60 * 60);
      return hours.toFixed(2);
    } catch (error) {
      console.error('Error calculating hours:', error);
      return '-';
    }
  }
  
  getStatusClass(status: string): string {
    switch (status) {
      case HoursStatus.PENDING:
        return 'pending-chip';
      case HoursStatus.APPROVED:
        return 'approved-chip';
      case HoursStatus.REJECTED:
        return 'rejected-chip';
      default:
        return '';
    }
  }
}