// // src/app/features/employee-management/employee-detail/employee-detail.component.ts
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { ActivatedRoute, Router, RouterModule } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatTableModule } from '@angular/material/table';
// import { MatTabsModule } from '@angular/material/tabs';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { MatDialogModule, MatDialog } from '@angular/material/dialog';
// import { MatSelectModule } from '@angular/material/select';
// import { FormsModule } from '@angular/forms';
// import { Employee } from '../../../shared/models/employee.model';
// import { Store } from '../../../shared/models/store.model';
// import { EmployeeService } from '../../../core/services/employee.service';
// import { StoreService } from '../../../core/services/store.service';
// import { AuthService } from '../../../core/services/auth.service';
// import { catchError } from 'rxjs/operators';
// import { of, Subscription } from 'rxjs';

// // Extended Employee interface for backward compatibility
// interface ExtendedEmployee extends Employee {
//   store_name?: string;
// }

// @Component({
//   selector: 'app-employee-detail',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     MatCardModule,
//     MatButtonModule,
//     MatIconModule,
//     MatDividerModule,
//     MatTableModule,
//     MatTabsModule,
//     MatProgressSpinnerModule,
//     MatSnackBarModule,
//     MatDialogModule,
//     MatSelectModule,
//     FormsModule
//   ],
//   templateUrl: './employee-detail.component.html',
//   styleUrls: ['./employee-detail.component.scss']
// })
// export class EmployeeDetailComponent implements OnInit, OnDestroy {
//   employee: ExtendedEmployee | null = null;
//   isLoading = true;
//   employeeId: string = '';
//   stores: Store[] = [];
//   selectedStoreId: string = '';
//   isAdmin = false;
//   isManager = false;
//   managedStoreId = '';
//   canEdit = false;
//   isAssigningStore = false;
//   error: string = '';
  
//   private userSubscription: Subscription | null = null;

//   constructor(
//     private route: ActivatedRoute,
//     private router: Router,
//     private employeeService: EmployeeService,
//     private storeService: StoreService,
//     private authService: AuthService,
//     private snackBar: MatSnackBar,
//     private dialog: MatDialog
//   ) {}

//   ngOnInit(): void {
//     this.employeeId = this.route.snapshot.paramMap.get('id') || '';
//     this.loadStores();
//     this.loadEmployee();
//     this.checkUserRole();
//   }
  
//   ngOnDestroy(): void {
//     if (this.userSubscription) {
//       this.userSubscription.unsubscribe();
//     }
//   }

//   loadEmployee(): void {
//     if (!this.employeeId) {
//       this.snackBar.open('Employee ID not provided', 'Close', { duration: 3000 });
//       this.router.navigate(['/employees']);
//       return;
//     }
  
//     this.isLoading = true;
//     this.error = '';
    
//     this.employeeService.getEmployeeById(this.employeeId)
//       .pipe(
//         catchError(error => {
//           this.error = error.message || 'Error loading employee details';
//           console.error('Error loading employee details:', error);
//           this.snackBar.open('Error loading employee details: ' + this.error, 'Close', { duration: 3000 });
//           this.router.navigate(['/employees']);
//           return of(null);
//         })
//       )
//       .subscribe(employee => {
//         if (employee) {
//           // Convert to extended employee for backward compatibility
//           const extendedEmployee: ExtendedEmployee = { ...employee };
          
//           // Handle store relationship
//           if (employee.store_id) {
//             // Find store in the already loaded stores
//             if (this.stores.length > 0) {
//               const assignedStore = this.stores.find(store => store._id === employee.store_id);
              
//               if (assignedStore) {
//                 extendedEmployee.store_name = assignedStore.name;
//               }
//             }
//           } else if (employee.store && employee.store.name) {
//             // If store data is included in the employee object
//             extendedEmployee.store_name = employee.store.name;
//           }
          
//           this.employee = extendedEmployee;
//           this.selectedStoreId = employee.store_id || '';
//         }
        
//         this.isLoading = false;
//         this.checkEditPermissions();
//       });
//   }

//   loadStores(): void {
//     this.storeService.getStores().subscribe({
//       next: (stores) => {
//         this.stores = stores;
//       },
//       error: (error) => {
//         this.error = error.message || 'Error loading stores';
//         console.error('Error loading stores:', error);
//         this.snackBar.open('Error loading stores: ' + this.error, 'Close', { duration: 3000 });
//       }
//     });
//   }

//   checkUserRole(): void {
//     this.userSubscription = this.authService.user$.subscribe(user => {
//       if (user) {
//         // Check permissions using standardized format
//         this.isAdmin = this.authService.hasPermission('users', 'approve');
//         this.isManager = this.authService.hasPermission('employees', 'approve') && 
//                        !this.isAdmin;
        
//         // For managed_store_id we still need to access it
//         this.managedStoreId = (user as any).managed_store_id || '';
        
//         this.checkEditPermissions();
//       }
//     });
//   }

//   checkEditPermissions(): void {
//     if (this.employee) {
//       // Admin can edit all employees
//       if (this.isAdmin) {
//         this.canEdit = true;
//         return;
//       }
      
//       // Manager can only edit employees in their store
//       if (this.isManager && this.employee.store_id === this.managedStoreId) {
//         this.canEdit = true;
//         return;
//       }
      
//       this.canEdit = false;
//     }
//   }

//   assignToStore(): void {
//     if (!this.employee) {
//       this.snackBar.open('Employee data is not loaded', 'Close', { duration: 3000 });
//       return;
//     }
    
//     if (!this.selectedStoreId) {
//       this.snackBar.open('Please select a store first', 'Close', { duration: 3000 });
//       return;
//     }
  
//     // Find the store object that corresponds to the selected ID
//     const selectedStore = this.stores.find(store => store._id === this.selectedStoreId);
    
//     this.isAssigningStore = true;
//     this.error = '';
  
//     this.employeeService.assignEmployeeToStore(this.employeeId, this.selectedStoreId)
//       .pipe(
//         catchError(error => {
//           this.isAssigningStore = false;
//           this.error = error.message || 'Error assigning employee to store';
//           console.error('Error assigning employee to store:', error);
//           this.snackBar.open('Error assigning employee to store: ' + this.error, 'Close', { duration: 3000 });
//           return of(null);
//         })
//       )
//       .subscribe(response => {
//         this.isAssigningStore = false;
        
//         if (response) {
//           // Create extended employee with store name
//           const updatedEmployee: ExtendedEmployee = { ...response };
          
//           // Add store_name for backward compatibility
//           if (selectedStore) {
//             updatedEmployee.store_name = selectedStore.name;
//           }
          
//           this.employee = updatedEmployee;
//           this.snackBar.open('Employee assigned to store successfully', 'Close', { duration: 3000 });
          
//           // Force a reload after a short delay to ensure server has processed
//           setTimeout(() => {
//             this.loadEmployee();
//           }, 1000);
//         } else {
//           this.snackBar.open('Failed to assign employee to store', 'Close', { duration: 3000 });
//         }
//       });
//   }

//   onBack(): void {
//     this.router.navigate(['/employees']);
//   }

//   onEdit(): void {
//     this.router.navigate(['/employees', this.employeeId, 'edit']);
//   }

//   formatDate(date: Date | string | undefined): string {
//     if (!date) return 'N/A';
//     return new Date(date).toLocaleDateString();
//   }

//   storeSelectionChanged(event: any): void {
//     // Logging for debugging purposes
//     console.log('Selected store ID is now:', this.selectedStoreId);
//   }
// }