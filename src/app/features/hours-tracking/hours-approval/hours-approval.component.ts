// src/app/features/hours-tracking/hours-approval/hours-approval.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { finalize } from 'rxjs';

import { HoursService } from '../../../core/auth/services/hours.service';
import { Hours, HoursApproval, HoursStatus } from '../../../core/auth/models/hours.model';

@Component({
  selector: 'app-hours-approval',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDividerModule
  ],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex items-center mb-4">
        <button mat-icon-button routerLink="/hours">
          <mat-icon>arrow_back</mat-icon>
        </button>
        <h1 class="text-2xl font-bold ml-2">Approve/Reject Hours</h1>
      </div>
      
      <div *ngIf="loading" class="flex justify-center py-8">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div *ngIf="!loading">
        <mat-card class="mb-6">
          <mat-card-header>
            <mat-card-title>Hours Record Details</mat-card-title>
          </mat-card-header>
          <mat-card-content class="pt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p><strong>Employee:</strong> {{ hours?.employee_name || 'Unknown' }}</p>
                <p><strong>Store:</strong> {{ hours?.store_name || 'Unknown' }}</p>
                <p><strong>Date:</strong> {{ hours?.clock_in ? (formatDate(hours?.clock_in) | date:'mediumDate') : '-' }}</p>
              </div>
              <div>
                <p><strong>Clock In:</strong> {{ hours?.clock_in ? (formatDate(hours?.clock_in) | date:'shortTime') : '-' }}</p>
                <p><strong>Clock Out:</strong> {{ hours?.clock_out ? (formatDate(hours?.clock_out) | date:'shortTime') : '-' }}</p>
                <p><strong>Total Hours:</strong> {{ hours?.total_minutes !== undefined && hours?.total_minutes !== null ? ((hours?.total_minutes || 0) / 60).toFixed(2) : '-' }}</p>
              </div>
            </div>
            
            <div *ngIf="hours?.break_start || hours?.break_end" class="mt-4">
              <p><strong>Break:</strong> 
                {{ hours?.break_start ? (formatDate(hours?.break_start) | date:'shortTime') : 'N/A' }} - 
                {{ hours?.break_end ? (formatDate(hours?.break_end) | date:'shortTime') : 'N/A' }}
              </p>
            </div>
            
            <div *ngIf="hours?.notes" class="mt-4">
              <p><strong>Notes:</strong></p>
              <p class="bg-gray-50 p-3 rounded">{{ hours?.notes }}</p>
            </div>
          </mat-card-content>
        </mat-card>
        
        <mat-card>
          <mat-card-header>
            <mat-card-title>Approval Decision</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <form [formGroup]="approvalForm" (ngSubmit)="onSubmit()">
              <div class="mt-4">
                <mat-label class="mb-2 block font-medium">Status</mat-label>
                <mat-radio-group formControlName="status" class="flex flex-col gap-3">
                  <mat-radio-button [value]="HoursStatus.APPROVED" color="primary">
                    Approve
                  </mat-radio-button>
                  <mat-radio-button [value]="HoursStatus.REJECTED" color="warn">
                    Reject
                  </mat-radio-button>
                </mat-radio-group>
              </div>
              
              <div class="mt-4">
                <mat-form-field class="w-full">
                  <mat-label>Notes</mat-label>
                  <textarea matInput formControlName="notes" rows="4" placeholder="Enter any comments about this approval/rejection"></textarea>
                </mat-form-field>
              </div>
              
              <div class="flex justify-end gap-3 mt-4">
                <button 
                  mat-button
                  type="button"
                  routerLink="/hours"
                >
                  Cancel
                </button>
                
                <button 
                  mat-raised-button 
                  [color]="approvalForm.get('status')?.value === HoursStatus.APPROVED ? 'primary' : 'warn'"
                  type="submit" 
                  [disabled]="!approvalForm.valid || submitting"
                >
                  <span *ngIf="!submitting">
                    {{ approvalForm.get('status')?.value === HoursStatus.APPROVED ? 'Approve' : 'Reject' }}
                  </span>
                  <mat-spinner *ngIf="submitting" diameter="24" class="inline-block"></mat-spinner>
                </button>
              </div>
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: []
})
export class HoursApprovalComponent implements OnInit {
  hours: Hours | null = null;
  approvalForm: FormGroup;
  loading = false;
  submitting = false;
  hoursId: string = '';
  
  // Expose enum to template
  HoursStatus = HoursStatus;
  
  constructor(
    private fb: FormBuilder,
    private hoursService: HoursService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.approvalForm = this.fb.group({
      status: [HoursStatus.APPROVED, Validators.required],
      notes: ['']
    });
  }
  
  ngOnInit(): void {
    this.loading = true;
    
    // Get hours ID from route params or query params
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.hoursId = id;
        this.loadHoursRecord();
      } else {
        // Try query params
        this.route.queryParamMap.subscribe(queryParams => {
          const queryId = queryParams.get('id');
          if (queryId) {
            this.hoursId = queryId;
            this.loadHoursRecord();
          } else {
            this.snackBar.open('No hours record ID provided', 'Close', { duration: 3000 });
            this.router.navigate(['/hours']);
          }
        });
      }
    });
  }
  
  loadHoursRecord(): void {
    this.hoursService.getHours(this.hoursId).subscribe({
      next: (hours: Hours) => {
        this.hours = hours;
        this.loading = false;
        
        // If already approved or rejected, show status in form
        if (hours.status !== HoursStatus.PENDING) {
          this.approvalForm.patchValue({
            status: hours.status,
            notes: hours.notes || ''
          });
          this.approvalForm.disable();
          this.snackBar.open(`This record has already been ${hours.status.toLowerCase()}`, 'Close', { duration: 5000 });
        }
      },
      error: (error: any) => {
        this.snackBar.open('Error loading hours record', 'Close', { duration: 3000 });
        this.loading = false;
        this.router.navigate(['/hours']);
      }
    });
  }
  
  onSubmit(): void {
    if (this.approvalForm.valid && this.hoursId) {
      this.submitting = true;
      
      const approvalData: HoursApproval = this.approvalForm.value;
      
      this.hoursService.approveHours(this.hoursId, approvalData)
        .pipe(finalize(() => this.submitting = false))
        .subscribe({
          next: (result: any) => {
            const action = approvalData.status === HoursStatus.APPROVED ? 'approved' : 'rejected';
            this.snackBar.open(`Hours record successfully ${action}`, 'Close', { duration: 3000 });
            this.router.navigate(['/hours']);
          },
          error: (error: { error?: { detail?: string } }) => {
            this.snackBar.open(error.error?.detail || `Error ${approvalData.status === HoursStatus.APPROVED ? 'approving' : 'rejecting'} hours record`, 'Close', { duration: 3000 });
          }
        });
    }
  }
  
  formatDate(date: string | Date | undefined | null): Date {
    if (!date) return new Date();
    return new Date(date);
  }
}