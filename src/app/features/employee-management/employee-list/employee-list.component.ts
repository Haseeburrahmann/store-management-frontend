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
import { Employee } from '../../../core/auth/models/employee.model';
import { EmployeeService } from '../../../core/auth/services/employee.service';
import { StoreService } from '../../../core/auth/services/store.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { catchError, map, switchMap } from 'rxjs/operators';
import { Subscription, of } from 'rxjs';
import { TimeInterval } from 'rxjs/internal/operators/timeInterval';

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
  employees: Employee[] = [];
  displayedColumns: string[] = ['full_name', 'email', 'position', 'store_name', 'employment_status', 'actions'];
  isLoading = false;
  totalCount = 0;
  pageSize = 10;
  pageIndex = 0;
  searchQuery = '';
  selectedStatus = '';
  selectedStoreId = '';
  stores: any[] = [];
  isAdmin = false;
  isManager = false;
  managedStoreId = '';
  refreshTimer:any;
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

  // For employee-list.component.ts
checkUserRole(): void {
  this.userSubscription = this.authService.user$.subscribe(user => {
    if (user) {
      // Use hasPermission method to determine roles
      this.isAdmin = this.authService.hasPermission('PermissionArea.USERS:PermissionAction.APPROVE');
      this.isManager = this.authService.hasPermission('PermissionArea.EMPLOYEES:PermissionAction.APPROVE') && 
                       !this.isAdmin; // Manager is someone with employee approve permissions but not admin
      
      // For managed_store_id we still need to access it
      this.managedStoreId = (user as any).managed_store_id || '';
      
      // If manager, pre-select their store
      if (this.isManager && this.managedStoreId) {
        this.selectedStoreId = this.managedStoreId;
      }
    }
  });
}
  

loadEmployeesWithStores(): void {
  this.isLoading = true;
  
  // Load stores first
  this.storeService.getStores().pipe(
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
    map(employees => {
      // Add store names to employees
      return employees.map(emp => {
        if (emp.store_id) {
          const store = this.stores.find(s => 
            s._id === emp.store_id || s.id === emp.store_id
          );
          
          if (store) {
            return {
              ...emp,
              store_name: store.name
            };
          }
        }
        return {
          ...emp,
          store_name: emp.store_name || 'Not Assigned'
        };
      });
    }),
    catchError(error => {
      this.snackBar.open('Error loading data', 'Close', { duration: 3000 });
      return of([]);
    })
  ).subscribe(employees => {
    this.employees = employees;
    this.isLoading = false;
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
      this.employeeService.deleteEmployee(id).subscribe(
        () => {
          this.snackBar.open('Employee deleted successfully', 'Close', { duration: 3000 });
          this.loadEmployeesWithStores();
        },
        (error) => {
          this.snackBar.open('Error deleting employee', 'Close', { duration: 3000 });
        }
      );
    }
  }

  
}