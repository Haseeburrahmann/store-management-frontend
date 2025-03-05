// src/app/features/hours-tracking/hours-list/hours-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { Subscription } from 'rxjs';

import { HoursService } from '../../../core/auth/services/hours.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { StoreService } from '../../../core/auth/services/store.service';
import { EmployeeService } from '../../../core/auth/services/employee.service';
import { Hours, HoursStatus } from '../../../core/auth/models/hours.model';
import { Store } from '../../../shared/models/store.model';
import { Employee } from '../../../core/auth/models/employee.model';

@Component({
  selector: 'app-hours-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatCardModule,
    MatChipsModule
  ],
  template: `
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold">Hours Records</h1>
        <button mat-raised-button color="primary" routerLink="/hours/clock">
          <mat-icon>schedule</mat-icon>
          Clock In/Out
        </button>
      </div>
      
      <mat-card class="mb-6">
        <mat-card-header>
          <mat-card-title>Filters</mat-card-title>
        </mat-card-header>
        <mat-card-content>
          <form [formGroup]="filterForm" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <mat-form-field>
              <mat-label>Store</mat-label>
              <mat-select formControlName="store_id">
                <mat-option [value]="''">All Stores</mat-option>
                <mat-option *ngFor="let store of stores" [value]="store._id">
                  {{ store.name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field *ngIf="isAdmin || isManager">
              <mat-label>Employee</mat-label>
              <mat-select formControlName="employee_id">
                <mat-option [value]="''">All Employees</mat-option>
                <mat-option *ngFor="let employee of employees" [value]="employee._id">
                  {{ employee.full_name }}
                </mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field>
              <mat-label>Status</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="''">All Statuses</mat-option>
                <mat-option [value]="HoursStatus.PENDING">Pending</mat-option>
                <mat-option [value]="HoursStatus.APPROVED">Approved</mat-option>
                <mat-option [value]="HoursStatus.REJECTED">Rejected</mat-option>
              </mat-select>
            </mat-form-field>
            
            <mat-form-field>
              <mat-label>Start Date</mat-label>
              <input matInput [matDatepicker]="startPicker" formControlName="start_date">
              <mat-datepicker-toggle matSuffix [for]="startPicker"></mat-datepicker-toggle>
              <mat-datepicker #startPicker></mat-datepicker>
            </mat-form-field>
            
            <mat-form-field>
              <mat-label>End Date</mat-label>
              <input matInput [matDatepicker]="endPicker" formControlName="end_date">
              <mat-datepicker-toggle matSuffix [for]="endPicker"></mat-datepicker-toggle>
              <mat-datepicker #endPicker></mat-datepicker>
            </mat-form-field>
          </form>
          
          <div class="flex justify-end gap-2 mt-4">
            <button mat-button (click)="resetFilters()">
              Reset Filters
            </button>
            <button mat-raised-button color="primary" (click)="applyFilters()">
              Apply Filters
            </button>
          </div>
        </mat-card-content>
      </mat-card>
      
      <div *ngIf="loading" class="flex justify-center py-8">
        <mat-spinner diameter="40"></mat-spinner>
      </div>
      
      <div *ngIf="!loading">
        <div *ngIf="hours.length === 0" class="text-center py-8">
          <p class="text-lg text-gray-500">No hours records found.</p>
        </div>
        
        <div *ngIf="hours.length > 0">
          <div class="overflow-x-auto">
            <table mat-table [dataSource]="hours" matSort class="w-full">
              <!-- Date Column -->
              <ng-container matColumnDef="date">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Date</th>
                <td mat-cell *matCellDef="let hour">
                  {{ formatDate(hour.clock_in) | date:'shortDate' }}
                </td>
              </ng-container>
              
              <!-- Employee Column -->
              <ng-container matColumnDef="employee">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Employee</th>
                <td mat-cell *matCellDef="let hour">
                  {{ hour.employee_name || 'Unknown Employee' }}
                </td>
              </ng-container>
              
              <!-- Store Column -->
              <ng-container matColumnDef="store">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Store</th>
                <td mat-cell *matCellDef="let hour">
                  {{ hour.store_name || 'Unknown Store' }}
                </td>
              </ng-container>
              
              <!-- Clock In Column -->
              <ng-container matColumnDef="clockIn">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Clock In</th>
                <td mat-cell *matCellDef="let hour">
                  {{ formatDate(hour.clock_in) | date:'shortTime' }}
                </td>
              </ng-container>
              
              <!-- Clock Out Column -->
              <ng-container matColumnDef="clockOut">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Clock Out</th>
                <td mat-cell *matCellDef="let hour">
                  {{ hour.clock_out ? (formatDate(hour.clock_out) | date:'shortTime') : 'Active' }}
                </td>
              </ng-container>
              
              <!-- Hours Column -->
              <ng-container matColumnDef="hours">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Hours</th>
                <td mat-cell *matCellDef="let hour">
                  {{ hour.total_minutes !== undefined && hour.total_minutes !== null ? ((hour.total_minutes || 0) / 60).toFixed(2) : '-' }}
                </td>
              </ng-container>
              
              <!-- Status Column -->
              <ng-container matColumnDef="status">
                <th mat-header-cell *matHeaderCellDef mat-sort-header>Status</th>
                <td mat-cell *matCellDef="let hour">
                  <mat-chip [ngClass]="getStatusClass(hour.status)">
                    {{ hour.status | titlecase }}
                  </mat-chip>
                </td>
              </ng-container>
              
              <!-- Actions Column -->
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Actions</th>
                <td mat-cell *matCellDef="let hour">
                  <button mat-icon-button [matMenuTriggerFor]="menu">
                    <mat-icon>more_vert</mat-icon>
                  </button>
                  <mat-menu #menu="matMenu">
                    <button mat-menu-item [routerLink]="['/hours', hour._id]">
                      <mat-icon>visibility</mat-icon>
                      <span>View Details</span>
                    </button>
                    <button 
                      mat-menu-item 
                      *ngIf="canApprove && hour.status === HoursStatus.PENDING"
                      [routerLink]="['/hours/approval']" 
                      [queryParams]="{id: hour._id}"
                    >
                      <mat-icon>check_circle</mat-icon>
                      <span>Approve/Reject</span>
                    </button>
                    <button 
                      mat-menu-item 
                      *ngIf="canEdit(hour) && hour.status === HoursStatus.PENDING"
                      [routerLink]="['/hours', hour._id]"
                    >
                      <mat-icon>edit</mat-icon>
                      <span>Edit</span>
                    </button>
                    <button 
                      mat-menu-item 
                      *ngIf="canDelete(hour) && hour.status === HoursStatus.PENDING"
                      (click)="deleteHours(hour)"
                    >
                      <mat-icon>delete</mat-icon>
                      <span>Delete</span>
                    </button>
                  </mat-menu>
                </td>
              </ng-container>
              
              <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
            </table>
          </div>
          
          <mat-paginator
            [pageSize]="10"
            [pageSizeOptions]="[5, 10, 25, 50]"
            showFirstLastButtons
          ></mat-paginator>
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
export class HoursListComponent implements OnInit, OnDestroy {
  hours: Hours[] = [];
  stores: Store[] = [];
  employees: Employee[] = [];
  loading = false;
  isAdmin = false;
  isManager = false;
  canApprove = false;
  currentUserId = '';
  
  displayedColumns: string[] = ['date', 'employee', 'store', 'clockIn', 'clockOut', 'hours', 'status', 'actions'];
  filterForm: FormGroup;
  
  // Expose enum to template
  HoursStatus = HoursStatus;
  
  private userSubscription: Subscription | null = null;
  
  constructor(
    private fb: FormBuilder,
    private hoursService: HoursService,
    private storeService: StoreService,
    private authService: AuthService,
    private employeeService: EmployeeService,
    private snackBar: MatSnackBar
  ) {
    this.filterForm = this.fb.group({
      store_id: [''],
      employee_id: [''],
      status: [''],
      start_date: [null],
      end_date: [null]
    });
  }
  
  ngOnInit(): void {
    this.loading = true;
    this.checkUserRole();
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  checkUserRole(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        this.currentUserId = user._id;
        
        // Use hasPermission method to determine roles
        this.isAdmin = this.authService.hasPermission('PermissionArea.USERS:PermissionAction.APPROVE');
        this.isManager = this.authService.hasPermission('PermissionArea.EMPLOYEES:PermissionAction.APPROVE') && 
                        !this.isAdmin; // Manager is someone with employee approve permissions but not admin
        
        this.canApprove = this.authService.hasPermission('PermissionArea.HOURS:PermissionAction.APPROVE');
        
        // If not admin or manager, employee can only see their own hours
        if (!this.isAdmin && !this.isManager) {
          this.filterForm.patchValue({ employee_id: this.currentUserId });
          // Remove employee column since it will always be the current user
          this.displayedColumns = this.displayedColumns.filter(col => col !== 'employee');
        }
        
        // Load data
        this.loadStores();
        this.loadEmployees();
        this.loadHours();
      }
    });
  }
  
  loadHours(): void {
    this.loading = true;
    
    const filters = this.filterForm.value;
    
    // If not admin or manager, employee can only see their own hours
    if (!this.isAdmin && !this.isManager) {
      this.hoursService.getEmployeeHours(
        this.currentUserId,
        filters.start_date,
        filters.end_date,
        filters.status
      ).subscribe({
        next: (hours) => {
          this.hours = hours;
          this.loading = false;
        },
        error: (error) => {
          this.snackBar.open('Error loading hours records', 'Close', { duration: 3000 });
          this.loading = false;
        }
      });
    } 
    // For admin and manager
    else {
      // If store filter is selected
      if (filters.store_id) {
        this.hoursService.getStoreHours(
          filters.store_id,
          filters.start_date,
          filters.end_date,
          filters.status
        ).subscribe({
          next: (hours) => {
            this.hours = hours;
            
            // If employee filter is also selected, filter client-side
            if (filters.employee_id) {
              this.hours = this.hours.filter(h => h.employee_id === filters.employee_id);
            }
            this.loading = false;
          },
          error: (error) => {
            this.snackBar.open('Error loading hours records', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      } 
      // If only employee filter is selected
      else if (filters.employee_id) {
        this.hoursService.getEmployeeHours(
          filters.employee_id,
          filters.start_date,
          filters.end_date,
          filters.status
        ).subscribe({
          next: (hours) => {
            this.hours = hours;
            this.loading = false;
          },
          error: (error) => {
            this.snackBar.open('Error loading hours records', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
      // If no employee or store filter, load pending approvals for managers/admins or all records for admins
      else {
        this.hoursService.getPendingApprovals().subscribe({
          next: (hours) => {
            this.hours = hours;
            
            // Apply status filter if selected
            if (filters.status) {
              this.hours = this.hours.filter(h => h.status === filters.status);
            }
            
            // Apply date filters if selected
            if (filters.start_date) {
              const startDate = new Date(filters.start_date);
              this.hours = this.hours.filter(h => new Date(h.clock_in) >= startDate);
            }
            
            if (filters.end_date) {
              const endDate = new Date(filters.end_date);
              this.hours = this.hours.filter(h => new Date(h.clock_in) <= endDate);
            }
            
            this.loading = false;
          },
          error: (error) => {
            this.snackBar.open('Error loading hours records', 'Close', { duration: 3000 });
            this.loading = false;
          }
        });
      }
    }
  }
  
  loadStores(): void {
    this.storeService.getStores().subscribe({
      next: (stores: Store[]) => {
        this.stores = stores;
      },
      error: (error) => {
        this.snackBar.open('Error loading stores', 'Close', { duration: 3000 });
      }
    });
  }
  
  loadEmployees(): void {
    if (this.isAdmin || this.isManager) {
      // Use a store-filtered employee list for managers
      const storeId = this.filterForm.get('store_id')?.value;
      
      if (this.isManager && storeId) {
        // Get employees for a specific store
        this.loadEmployeesByStore(storeId);
      } else {
        // Get all employees
        this.loadAllEmployees();
      }
    }
  }
  
  loadAllEmployees(): void {
    // Use the EmployeeService instead of AuthService
    this.employeeService.getEmployees().subscribe({
      next: (employees: Employee[]) => {
        this.employees = employees;
      },
      error: (error: any) => {
        this.snackBar.open('Error loading employees', 'Close', { duration: 3000 });
      }
    });
  }
  
  loadEmployeesByStore(storeId: string): void {
    // Use the EmployeeService instead of AuthService
    this.employeeService.getEmployeesByStore(storeId).subscribe({
      next: (employees: Employee[]) => {
        this.employees = employees;
      },
      error: (error: any) => {
        this.snackBar.open('Error loading employees for store', 'Close', { duration: 3000 });
      }
    });
  }
  
  applyFilters(): void {
    this.loadHours();
  }
  
  resetFilters(): void {
    this.filterForm.reset({
      store_id: '',
      employee_id: this.isAdmin || this.isManager ? '' : this.currentUserId,
      status: '',
      start_date: null,
      end_date: null
    });
    this.loadHours();
  }
  
  canEdit(hour: Hours): boolean {
    // Current user's own hours or manager/admin for their store
    if (hour.employee_id === this.currentUserId) {
      return true;
    }
    
    if (this.isManager) {
      // Check if store is managed by current user
      const storeId = hour.store_id;
      return this.stores.some(store => 
        store._id === storeId && store.manager_id === this.currentUserId
      );
    }
    
    return this.isAdmin;
  }
  
  canDelete(hour: Hours): boolean {
    // Similar logic to canEdit but may be more restrictive
    return this.canEdit(hour) && this.authService.hasPermission('PermissionArea.HOURS:PermissionAction.DELETE');
  }
  
  deleteHours(hour: Hours): void {
    if (confirm('Are you sure you want to delete this hours record?')) {
      this.hoursService.deleteHours(hour._id).subscribe({
        next: () => {
          this.snackBar.open('Hours record deleted successfully', 'Close', { duration: 3000 });
          this.loadHours();
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