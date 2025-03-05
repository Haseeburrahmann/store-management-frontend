// src/app/features/employee-management/employee-list/employee-list.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Employee } from '../../../shared/models/employee.model';
import { Store } from '../../../shared/models/store.model';
import { EmployeeService } from '../../../core/services/employee.service';
import { StoreService } from '../../../core/services/store.service';
import { AuthService } from '../../../core/services/auth.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';

// Extended Employee interface for backward compatibility
interface ExtendedEmployee extends Employee {
  store_name?: string;
  display_name?: string;  // Added display name field
  display_email?: string; // Added display email field
}

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatFormFieldModule,
    MatCheckboxModule,
    MatCardModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatTooltipModule
  ],
  templateUrl: './employee-list.component.html',
  styleUrls: ['./employee-list.component.scss']
})
export class EmployeeListComponent implements OnInit, OnDestroy {
  employees: ExtendedEmployee[] = [];
  displayedColumns: string[] = ['full_name', 'email', 'position', 'store_name', 'employment_status', 'actions'];
  isLoading = false;
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  searchQuery = '';
  selectedStatus = '';
  selectedStoreId = '';
  stores: Store[] = [];
  isAdmin = false;
  isManager = false;
  managedStoreId = '';
  refreshTimer: any;
  error: string = '';
  
  // Permission flags
  canCreateEmployee = false;
  canEditEmployee = false;
  canDeleteEmployee = false;
  
  private userSubscription: Subscription | null = null;
  

  constructor(
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.checkUserRole();
    this.loadEmployeesWithStores();
    this.refreshTimer = setInterval(() => this.loadEmployeesWithStores(), 30000);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
  }

  checkUserRole(): void {
    this.userSubscription = this.authService.user$.subscribe(user => {
      if (user) {
        // Check permissions using standardized format
        this.isAdmin = this.authService.hasPermission('users', 'approve');
        this.isManager = this.authService.hasPermission('employees', 'approve') && 
                       !this.isAdmin; // Manager is someone with employee approve permissions but not admin
        
        // For managed_store_id we still need to access it
        this.managedStoreId = (user as any).managed_store_id || '';
        
        // Set permission flags for action buttons
        this.canCreateEmployee = this.authService.hasPermission('employees', 'write');
        this.canEditEmployee = this.authService.hasPermission('employees', 'write');
        this.canDeleteEmployee = this.authService.hasPermission('employees', 'delete');
        
        // If manager, pre-select their store
        if (this.isManager && this.managedStoreId) {
          this.selectedStoreId = this.managedStoreId;
        }
      }
    });
  }

  loadEmployeesWithStores(): void {
    this.isLoading = true;
    this.error = '';
    
    // Load stores first
    this.storeService.getStores().pipe(
      catchError(error => {
        this.error = error.message || 'Error loading stores';
        console.error('Error loading stores:', error);
        this.snackBar.open('Error loading stores: ' + this.error, 'Close', { duration: 3000 });
        return of([]);
      }),
      switchMap(stores => {
        // Store the stores data
        this.stores = stores;
        
        // Then load employees
        return this.employeeService.getEmployees(
          this.pageIndex * this.pageSize, 
          this.pageSize, 
          this.selectedStoreId, 
          this.searchQuery, 
          this.selectedStatus
        );
      }),
      catchError(error => {
        this.isLoading = false;
        this.error = error.message || 'Error loading employees';
        console.error('Error loading employees:', error);
        this.snackBar.open('Error loading employees: ' + this.error, 'Close', { duration: 3000 });
        return of([]);
      }),
      map(employees => {
        // Add store names and handle missing user information
        return employees.map(emp => {
          const extendedEmp: ExtendedEmployee = { ...emp };
          
          // Handle store relationship
          if (emp.store_id) {
            // Try to find store by ID
            const store = this.stores.find(s => s._id === emp.store_id);
            
            if (store) {
              // Add store_name for backward compatibility
              extendedEmp.store_name = store.name;
            }
          } else if (emp.store && emp.store.name) {
            // If store object exists, use its name
            extendedEmp.store_name = emp.store.name;
          } else {
            extendedEmp.store_name = 'Not Assigned';
          }
          
          // Handle display name for employees without users
          if (emp.full_name) {
            extendedEmp.display_name = emp.full_name;
          } else if (emp.position) {
            // Use position as a fallback if no name is available
            extendedEmp.display_name = `${emp.position} (No User Account)`;
          } else {
            extendedEmp.display_name = 'Employee (No User Account)';
          }
          
          // Handle display email for employees without users
          if (emp.email) {
            extendedEmp.display_email = emp.email;
          } else {
            extendedEmp.display_email = 'No Email Available';
          }
          
          return extendedEmp;
        });
      })
    ).subscribe({
      next: (employees) => {
        this.employees = employees;
        this.totalCount = employees.length; // Update for pagination
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Error loading data';
        console.error('Error in employee-store pipeline:', error);
        this.snackBar.open('Error loading data: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEmployeesWithStores();
  }

  applyFilter(): void {
    this.pageIndex = 0;
    this.loadEmployeesWithStores();
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedStatus = '';
    this.selectedStoreId = this.isManager ? this.managedStoreId : '';
    this.pageIndex = 0;
    this.loadEmployeesWithStores();
  }

  deleteEmployee(id: string): void {
    if (confirm('Are you sure you want to delete this employee?')) {
      this.employeeService.deleteEmployee(id).subscribe({
        next: () => {
          this.snackBar.open('Employee deleted successfully', 'Close', { duration: 3000 });
          this.loadEmployeesWithStores();
        },
        error: (error) => {
          this.error = error.message || 'Error deleting employee';
          console.error('Error deleting employee:', error);
          this.snackBar.open('Error deleting employee: ' + this.error, 'Close', { duration: 3000 });
        }
      });
    }
  }

  // Helper method to check if user can edit a specific employee
  canEditSpecificEmployee(employee: Employee): boolean {
    if (this.isAdmin) return true;
    if (this.isManager && employee.store_id === this.managedStoreId) return true;
    return false;
  }

  // Helper method to get display name
  getDisplayName(employee: ExtendedEmployee): string {
    return employee.display_name || employee.full_name || 'Employee (No User Account)';
  }

  // Helper method to get display email
  getDisplayEmail(employee: ExtendedEmployee): string {
    return employee.display_email || employee.email || 'No Email Available';
  }
}