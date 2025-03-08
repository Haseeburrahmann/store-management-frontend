// // src/app/features/store-management/store-detail/store-detail.component.ts
// import { Component, OnInit, OnDestroy } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { RouterModule, ActivatedRoute, Router } from '@angular/router';
// import { MatCardModule } from '@angular/material/card';
// import { MatButtonModule } from '@angular/material/button';
// import { MatIconModule } from '@angular/material/icon';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatChipsModule } from '@angular/material/chips';
// import { MatDividerModule } from '@angular/material/divider';
// import { MatSelectModule } from '@angular/material/select';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// import { FormsModule } from '@angular/forms';
// import { Subscription } from 'rxjs';

// import { StoreService } from '../../../core/services/store.service';
// import { UserService } from '../../../core/services/user.service';
// import { RoleService } from '../../../core/services/role.service';
// import { AuthService } from '../../../core/services/auth.service';
// import { Store } from '../../../shared/models/store.model';
// import { User } from '../../../core/auth/models/user.model';

// // Extended store interface to handle legacy properties
// interface ExtendedStore extends Store {
//   manager_name?: string;
// }

// @Component({
//   selector: 'app-store-detail',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     MatCardModule,
//     MatButtonModule,
//     MatIconModule,
//     MatProgressSpinnerModule,
//     MatChipsModule,
//     MatDividerModule,
//     MatSelectModule,
//     MatSnackBarModule,
//     FormsModule
//   ],
//   templateUrl: './store-detail.component.html',
//   styleUrls: ['./store-detail.component.scss']
// })
// export class StoreDetailComponent implements OnInit, OnDestroy {
//   store: ExtendedStore | null = null;
//   isLoading = true;
//   managers: User[] = [];
//   selectedManagerId: string = '';
//   isAssigningManager = false;
//   error: string = '';
  
//   // Permission flags
//   canEditStore = false;
//   canDeleteStore = false;
//   canAssignManager = false;
  
//   private userSubscription?: Subscription;

//   constructor(
//     private storeService: StoreService,
//     private userService: UserService,
//     private roleService: RoleService,
//     private authService: AuthService,
//     private route: ActivatedRoute,
//     private router: Router,
//     private snackBar: MatSnackBar
//   ) {}

//   ngOnInit(): void {
//     this.checkPermissions();
//     this.loadStore();
//     this.loadManagers();
//   }
  
//   ngOnDestroy(): void {
//     if (this.userSubscription) {
//       this.userSubscription.unsubscribe();
//     }
//   }
  
//   checkPermissions(): void {
//     this.userSubscription = this.authService.user$.subscribe(user => {
//       if (user) {
//         this.canEditStore = this.authService.hasPermission('stores', 'write');
//         this.canDeleteStore = this.authService.hasPermission('stores', 'delete');
//         this.canAssignManager = this.authService.hasPermission('stores', 'write');
//       }
//     });
//   }

//   loadStore(): void {
//     const storeId = this.route.snapshot.paramMap.get('id');
//     if (!storeId) {
//       this.router.navigate(['/stores']);
//       return;
//     }

//     this.isLoading = true;
//     this.error = '';
    
//     this.storeService.getStore(storeId).subscribe({
//       next: (store) => {
//         // Initialize manager_name for legacy support
//         this.store = store as ExtendedStore;
        
//         // Set manager_name for legacy UI components
//         if (store.manager && store.manager.full_name) {
//           this.store.manager_name = store.manager.full_name;
//         }
        
//         this.selectedManagerId = store.manager_id || '';
//         this.isLoading = false;
//       },
//       error: (error) => {
//         this.isLoading = false;
//         this.error = error.message || 'Error loading store details';
//         console.error('Error loading store details:', error);
//         this.snackBar.open('Error loading store details: ' + this.error, 'Close', { duration: 3000 });
//         this.router.navigate(['/stores']);
//       }
//     });
//   }

//   loadManagers(): void {
//     // First, load all the roles to get the Manager role ID
//     this.roleService.getRoles().subscribe({
//       next: (roles) => {
//         // Find the manager role
//         const managerRole = roles.find(role => role.name === 'Manager');
        
//         if (managerRole) {
//           // Now get users with the manager role ID
//           this.userService.getUsers().subscribe({
//             next: (users) => {
//               // Filter users who have the manager role ID
//               this.managers = users.filter(user => user.role_id === managerRole._id);
//             },
//             error: (error) => {
//               this.error = error.message || 'Error loading users';
//               console.error('Error loading users:', error);
//               this.snackBar.open('Error loading users: ' + this.error, 'Close', { duration: 3000 });
//             }
//           });
//         } else {
//           this.error = 'Manager role not found';
//           console.error('Manager role not found');
//           this.snackBar.open('Manager role not found', 'Close', { duration: 3000 });
//         }
//       },
//       error: (error) => {
//         this.error = error.message || 'Error loading roles';
//         console.error('Error loading roles:', error);
//         this.snackBar.open('Error loading roles: ' + this.error, 'Close', { duration: 3000 });
//       }
//     });
//   }

//   assignManager(): void {
//     if (!this.store || !this.selectedManagerId) return;
    
//     this.isAssigningManager = true;
//     this.error = '';
    
//     // Use storeId consistently - ensure we use _id 
//     const storeId = this.store._id;
    
//     this.storeService.assignManager(storeId, this.selectedManagerId).subscribe({
//       next: (updatedStore) => {
//         // Find the selected manager to update the display
//         const selectedManager = this.managers.find(m => m._id === this.selectedManagerId);
        
//         if (selectedManager && this.store) {
//           // Update manager info in our store object
//           this.store.manager_id = this.selectedManagerId;
          
//           // Update the manager name for display (for legacy components)
//           this.store.manager_name = selectedManager.full_name;
          
//           // Update the manager object if it exists
//           if (!this.store.manager) {
//             // Create a complete User object with all required properties
//             this.store.manager = { 
//               _id: selectedManager._id,
//               email: selectedManager.email,
//               full_name: selectedManager.full_name,
//               is_active: selectedManager.is_active || true,
//               created_at: selectedManager.created_at || new Date().toISOString(),
//               updated_at: selectedManager.updated_at || new Date().toISOString(),
//               role_id: selectedManager.role_id
//             };
//           } else {
//             // If manager object already exists, just update the necessary fields
//             this.store.manager._id = selectedManager._id;
//             this.store.manager.full_name = selectedManager.full_name;
//             this.store.manager.email = selectedManager.email;
            
//             // Make sure the other required fields have values
//             if (!this.store.manager.is_active) {
//               this.store.manager.is_active = selectedManager.is_active || true;
//             }
//             if (!this.store.manager.created_at) {
//               this.store.manager.created_at = selectedManager.created_at || new Date().toISOString();
//             }
//             if (!this.store.manager.updated_at) {
//               this.store.manager.updated_at = selectedManager.updated_at || new Date().toISOString();
//             }
//           }
          
//           this.snackBar.open('Manager assigned successfully', 'Close', { duration: 3000 });
//         }
        
//         this.isAssigningManager = false;
//       },
//       error: (error) => {
//         this.isAssigningManager = false;
//         this.error = error.message || 'Error assigning manager';
//         console.error('Error assigning manager:', error);
//         this.snackBar.open('Error assigning manager: ' + this.error, 'Close', { duration: 3000 });
//       }
//     });
//   }

//   deleteStore(): void {
//     if (!this.store) return;
    
//     if (confirm('Are you sure you want to delete this store?')) {
//       this.isLoading = true;
//       this.error = '';
      
//       // Use storeId consistently - ensure we use _id
//       const storeId = this.store._id;
      
//       this.storeService.deleteStore(storeId).subscribe({
//         next: () => {
//           this.snackBar.open('Store deleted successfully', 'Close', { duration: 3000 });
//           this.router.navigate(['/stores']);
//         },
//         error: (error) => {
//           this.isLoading = false;
//           this.error = error.message || 'Error deleting store';
//           console.error('Error deleting store:', error);
//           this.snackBar.open('Error deleting store: ' + this.error, 'Close', { duration: 3000 });
//         }
//       });
//     }
//   }
// }