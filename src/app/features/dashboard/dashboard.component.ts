// src/app/features/dashboard/dashboard.component.ts

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { Store } from '../../shared/models/store.model';
import { Employee } from '../../shared/models/employee.model';
import { Hours, HoursStatus } from '../../shared/models/hours.model';
import { StoreService } from '../../core/services/store.service';
import { EmployeeService } from '../../core/services/employee.service';
import { HoursService } from '../../core/services/hours.service';
import { AuthService } from '../../core/services/auth.service';
import { UserWithPermissions } from '../../core/auth/models/user.model';
import { Subscription, forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatSnackBarModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  // User information
  currentUser: UserWithPermissions | null = null;
  isAdmin = false;
  isManager = false;
  isEmployee = false;
  
  // Dashboard data
  stores: Store[] = [];
  employees: Employee[] = [];
  pendingHours: Hours[] = [];
  
  // Loading states
  isLoadingStores = false;
  isLoadingEmployees = false;
  isLoadingHours = false;
  
  // Error states
  storesError = '';
  employeesError = '';
  hoursError = '';
  
  // Stats
  totalStores = 0;
  totalEmployees = 0;
  totalPendingHours = 0;
  
  private userSubscription: Subscription | null = null;
  
  constructor(
    private storeService: StoreService,
    private employeeService: EmployeeService,
    private hoursService: HoursService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private checkUserRole(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      this.currentUser = user;
      
      if (user) {
        // Check permissions
        this.isAdmin = this.authService.hasPermission('users', 'approve');
        this.isManager = !this.isAdmin && this.authService.hasPermission('employees', 'approve');
        this.isEmployee = !this.isAdmin && !this.isManager && this.authService.hasPermission('hours', 'write');
        
        // Load data based on role
        this.loadDashboardData();
      }
    });
  }

  private loadDashboardData(): void {
    if (this.isAdmin) {
      this.loadAdminDashboard();
    } else if (this.isManager) {
      this.loadManagerDashboard();
    } else {
      this.loadEmployeeDashboard();
    }
  }

  private loadAdminDashboard(): void {
    this.loadStores();
    this.loadEmployees();
    this.loadPendingHours();
  }

  private loadManagerDashboard(): void {
    // Get managed store ID (assuming it's stored in user object)
    const managedStoreId = (this.currentUser as any).managed_store_id;
    
    if (managedStoreId) {
      this.loadStoreById(managedStoreId);
      this.loadEmployeesByStore(managedStoreId);
      this.loadPendingHoursByStore(managedStoreId);
    } else {
      this.snackBar.open('No managed store found. Please contact an administrator.', 'Close', { duration: 5000 });
    }
  }

  private loadEmployeeDashboard(): void {
    // For regular employee, just show basic info
    // Load active shifts if any
    if (this.currentUser) {
      const userId = this.currentUser._id;
      this.loadEmployeeData(userId);
    }
  }

  private loadStores(): void {
    this.isLoadingStores = true;
    this.storesError = '';
    
    this.storeService.getStores()
      .pipe(
        catchError(error => {
          this.storesError = error.message || 'Error loading stores';
          console.error('Error loading stores:', error);
          return of([]);
        })
      )
      .subscribe(stores => {
        this.stores = stores;
        this.totalStores = stores.length;
        this.isLoadingStores = false;
      });
  }

  private loadStoreById(storeId: string): void {
    this.isLoadingStores = true;
    this.storesError = '';
    
    this.storeService.getStore(storeId)
      .pipe(
        catchError(error => {
          this.storesError = error.message || `Error loading store with ID ${storeId}`;
          console.error(`Error loading store with ID ${storeId}:`, error);
          return of(null);
        })
      )
      .subscribe(store => {
        if (store) {
          this.stores = [store];
          this.totalStores = 1;
        }
        this.isLoadingStores = false;
      });
  }

  private loadEmployees(): void {
    this.isLoadingEmployees = true;
    this.employeesError = '';
    
    this.employeeService.getEmployees()
      .pipe(
        catchError(error => {
          this.employeesError = error.message || 'Error loading employees';
          console.error('Error loading employees:', error);
          return of([]);
        })
      )
      .subscribe(employees => {
        this.employees = employees;
        this.totalEmployees = employees.length;
        this.isLoadingEmployees = false;
      });
  }

  private loadEmployeesByStore(storeId: string): void {
    this.isLoadingEmployees = true;
    this.employeesError = '';
    
    this.employeeService.getEmployees(0, 100, storeId)
      .pipe(
        catchError(error => {
          this.employeesError = error.message || `Error loading employees for store ${storeId}`;
          console.error(`Error loading employees for store ${storeId}:`, error);
          return of([]);
        })
      )
      .subscribe(employees => {
        this.employees = employees;
        this.totalEmployees = employees.length;
        this.isLoadingEmployees = false;
      });
  }

  private loadEmployeeData(userId: string): void {
    // This would typically find the employee record associated with the user
    // And then load hours and other employee-specific data
    // For now, we'll keep it simple
    this.snackBar.open('Welcome to your dashboard!', 'Close', { duration: 3000 });
  }

  private loadPendingHours(): void {
    this.isLoadingHours = true;
    this.hoursError = '';
    
    this.hoursService.getPendingApprovals()
      .pipe(
        catchError(error => {
          this.hoursError = error.message || 'Error loading pending hours';
          console.error('Error loading pending hours:', error);
          return of([]);
        })
      )
      .subscribe(hours => {
        this.pendingHours = hours;
        this.totalPendingHours = hours.length;
        this.isLoadingHours = false;
      });
  }

  private loadPendingHoursByStore(storeId: string): void {
    this.isLoadingHours = true;
    this.hoursError = '';
    
    this.hoursService.getStoreHours(storeId, undefined, undefined, HoursStatus.PENDING)
      .pipe(
        catchError(error => {
          this.hoursError = error.message || `Error loading pending hours for store ${storeId}`;
          console.error(`Error loading pending hours for store ${storeId}:`, error);
          return of([]);
        })
      )
      .subscribe(hours => {
        this.pendingHours = hours;
        this.totalPendingHours = hours.length;
        this.isLoadingHours = false;
      });
  }

  navigateToStores(): void {
    this.router.navigate(['/stores']);
  }

  navigateToEmployees(): void {
    this.router.navigate(['/employees']);
  }

  navigateToHours(): void {
    this.router.navigate(['/hours']);
  }

  navigateToHoursApproval(): void {
    this.router.navigate(['/hours/approvals']);
  }

  navigateToReports(): void {
    this.router.navigate(['/reports']);
  }

  navigateToProfile(): void {
    this.router.navigate(['/profile']);
  }
}