// src/app/features/employee-management/employee-detail/employee-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Employee } from '../../../core/auth/models/employee.model';
import { EmployeeService } from '../../../core/auth/services/employee.service';
import { StoreService } from '../../../core/auth/services/store.service';
import { AuthService } from '../../../core/auth/services/auth.service';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-employee-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatTableModule,
    MatTabsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatSelectModule,
    FormsModule
  ],
  templateUrl: './employee-detail.component.html',
  styleUrls: ['./employee-detail.component.scss']
})
export class EmployeeDetailComponent implements OnInit {
  employee: Employee | null = null;
  isLoading = true;
  employeeId: string = '';
  stores: any[] = [];
  selectedStoreId: string = '';
  isAdmin = false;
  isManager = false;
  managedStoreId = '';
  canEdit = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private storeService: StoreService,
    private authService: AuthService,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.employeeId = this.route.snapshot.paramMap.get('id') || '';
    this.loadStores();
    this.loadEmployee();
    this.checkUserRole();
  }

  loadEmployee(): void {
    if (!this.employeeId) {
      this.snackBar.open('Employee ID not provided', 'Close', { duration: 3000 });
      this.router.navigate(['/employees']);
      return;
    }
  
    this.isLoading = true;
    this.employeeService.getEmployeeById(this.employeeId)
      .pipe(
        catchError(error => {
          this.snackBar.open('Error loading employee details', 'Close', { duration: 3000 });
          this.router.navigate(['/employees']);
          return of(null);
        })
      )
      .subscribe(employee => {
        if (employee) {
          console.log('Loaded employee:', employee);
          
          // If the employee has a store_id but no store_name,
          // try to get the store name from our stores array
          if (employee.store_id && !employee.store_name && this.stores.length > 0) {
            const assignedStore = this.stores.find(store => 
              store._id === employee.store_id || store.id === employee.store_id
            );
            
            if (assignedStore) {
              employee.store_name = assignedStore.name;
            }
          }
          
          this.employee = employee;
          this.selectedStoreId = employee.store_id || '';
          console.log('Initial selectedStoreId:', this.selectedStoreId);
        }
        this.isLoading = false;
        this.checkEditPermissions();
      });
  }

 // src/app/features/employee-management/employee-detail/employee-detail.component.ts
loadStores(): void {
  this.storeService.getStores().subscribe(
    (stores) => {
      // Log the raw store data to see its structure
      console.log('Raw store data:', JSON.stringify(stores));

      // Extract store IDs based on the actual structure
      this.stores = stores.map(store => {
        // Look for where the ID might be stored
        const id = store._id || store.id || (store._id?.$oid);
        
        // Create a copy of the store with a guaranteed _id property
        return {
          ...store,
          _id: id || ''  // Fallback to empty string if no ID found
        };
      });
      
      console.log('Processed stores for dropdown:', this.stores);
    },
    (error) => {
      this.snackBar.open('Error loading stores', 'Close', { duration: 3000 });
    }
  );
}

  // For employee-detail.component.ts
checkUserRole(): void {
  this.authService.user$.subscribe(user => {
    if (user) {
      // Use hasPermission method to determine roles
      this.isAdmin = this.authService.hasPermission('PermissionArea.USERS:PermissionAction.APPROVE');
      this.isManager = this.authService.hasPermission('PermissionArea.EMPLOYEES:PermissionAction.APPROVE') && 
                       !this.isAdmin;
      
      // For managed_store_id we still need to access it
      this.managedStoreId = (user as any).managed_store_id || '';
      
      this.checkEditPermissions();
    }
  });
}

  checkEditPermissions(): void {
    if (this.employee) {
      // Admin can edit all employees
      if (this.isAdmin) {
        this.canEdit = true;
        return;
      }
      
      // Manager can only edit employees in their store
      if (this.isManager && this.employee.store_id === this.managedStoreId) {
        this.canEdit = true;
        return;
      }
      
      this.canEdit = false;
    }
  }

  // src/app/features/employee-management/employee-detail/employee-detail.component.ts
  assignToStore(): void {
    console.log('Trying to assign employee to store. Selected ID:', this.selectedStoreId);
    
    if (!this.employee) {
      this.snackBar.open('Employee data is not loaded', 'Close', { duration: 3000 });
      return;
    }
    
    if (!this.selectedStoreId) {
      this.snackBar.open('Please select a store first', 'Close', { duration: 3000 });
      return;
    }
  
    // Find the store object that corresponds to the selected ID
    const selectedStore = this.stores.find(store => 
      store._id === this.selectedStoreId || store.id === this.selectedStoreId
    );
    
    console.log('Selected store object:', selectedStore);
  
    this.employeeService.assignEmployeeToStore(this.employeeId, this.selectedStoreId)
      .pipe(
        catchError(error => {
          console.error('Error assigning employee to store:', error);
          this.snackBar.open('Error assigning employee to store: ' + (error.message || 'Unknown error'), 'Close', { duration: 3000 });
          return of(null);
        })
      )
      .subscribe(response => {
        console.log('Assignment response:', response);
        if (response) {
          // Update the local employee object with the new store information
          this.employee = {
            ...response,
            // Ensure the store_name is set even if not returned by the API
            store_name: selectedStore ? selectedStore.name : 'Unknown Store'
          };
          
          this.snackBar.open('Employee assigned to store successfully', 'Close', { duration: 3000 });
          
          // Force a reload of the employee data after a short delay
          // This helps ensure the server has processed the assignment
          setTimeout(() => {
            this.loadEmployee();
            // Also navigate away and back to ensure a full refresh
            this.router.navigateByUrl('/employees', { skipLocationChange: true }).then(() => {
              this.router.navigate(['/employees', this.employeeId]);
            });
          }, 1000);
        } else {
          this.snackBar.open('Failed to assign employee to store', 'Close', { duration: 3000 });
        }
      });
  }

  onBack(): void {
    this.router.navigate(['/employees']);
  }

  onEdit(): void {
    this.router.navigate(['/employees', this.employeeId, 'edit']);
  }

  formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }

  storeSelectionChanged(event: any): void {
    console.log('Store selection changed:', event);
    console.log('Selected store ID is now:', this.selectedStoreId);
    console.log('Selected store ID type:', typeof this.selectedStoreId);
    
    // Find the selected store for more info
    const selectedStore = this.stores.find(s => s._id === this.selectedStoreId);
    console.log('Selected store object:', selectedStore);
  }
}