// // src/app/features/store-management/store-form/store-form.component.ts
// import { Component, OnInit } from '@angular/core';
// import { CommonModule } from '@angular/common';
// import { Router, ActivatedRoute, RouterModule } from '@angular/router';
// import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
// import { MatCardModule } from '@angular/material/card';
// import { MatInputModule } from '@angular/material/input';
// import { MatButtonModule } from '@angular/material/button';
// import { MatSelectModule } from '@angular/material/select';
// import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
// import { MatCheckboxModule } from '@angular/material/checkbox';
// import { MatIconModule } from '@angular/material/icon';
// import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

// import { StoreService } from '../../../core/services/store.service';
// import { UserService } from '../../../core/services/user.service';
// import { RoleService } from '../../../core/services/role.service';
// import { Store, StoreCreate, StoreUpdate } from '../../../shared/models/store.model';
// import { User } from '../../../core/auth/models/user.model';

// @Component({
//   selector: 'app-store-form',
//   standalone: true,
//   imports: [
//     CommonModule,
//     RouterModule,
//     ReactiveFormsModule,
//     MatCardModule,
//     MatInputModule,
//     MatButtonModule,
//     MatSelectModule,
//     MatProgressSpinnerModule,
//     MatCheckboxModule,
//     MatIconModule,
//     MatSnackBarModule
//   ],
//   templateUrl: './store-form.component.html',
//   styleUrls: ['./store-form.component.scss']
// })
// export class StoreFormComponent implements OnInit {
//   storeForm: FormGroup;
//   isEditMode = false;
//   storeId: string | null = null;
//   isLoading = false;
//   isSaving = false;
//   managers: User[] = [];
//   isLoadingManagers = false;
//   error: string = '';

//   constructor(
//     private fb: FormBuilder,
//     private storeService: StoreService,
//     private userService: UserService,
//     private roleService: RoleService,
//     private router: Router,
//     private route: ActivatedRoute,
//     private snackBar: MatSnackBar
//   ) {
//     this.storeForm = this.fb.group({
//       name: ['', [Validators.required]],
//       address: ['', [Validators.required]],
//       city: ['', [Validators.required]],
//       state: ['', [Validators.required]],
//       zip_code: ['', [Validators.required]],
//       phone: ['', [Validators.required]],
//       email: ['', [Validators.email]],
//       manager_id: [''],
//       is_active: [true]
//     });
//   }

//   ngOnInit(): void {
//     this.loadManagers();
    
//     this.storeId = this.route.snapshot.paramMap.get('id');
//     this.isEditMode = !!this.storeId && this.storeId !== 'new';
    
//     if (this.isEditMode && this.storeId) {
//       this.loadStoreData(this.storeId);
//     }
//   }

//   loadManagers(): void {
//     this.isLoadingManagers = true;
//     this.error = '';
    
//     // First get the manager role ID
//     this.roleService.getRoles().subscribe({
//       next: (roles) => {
//         const managerRole = roles.find(role => role.name === 'Manager');
        
//         if (managerRole) {
//           // Then get users with that role
//           this.userService.getUsers().subscribe({
//             next: (users) => {
//               this.managers = users.filter(user => user.role_id === managerRole._id);
//               this.isLoadingManagers = false;
//             },
//             error: (error) => {
//               this.isLoadingManagers = false;
//               this.error = error.message || 'Error loading users';
//               console.error('Error loading users:', error);
//               this.snackBar.open('Error loading users: ' + this.error, 'Close', { duration: 3000 });
//             }
//           });
//         } else {
//           this.isLoadingManagers = false;
//           this.error = 'Manager role not found';
//           console.error('Manager role not found');
//           this.snackBar.open('Manager role not found', 'Close', { duration: 3000 });
//         }
//       },
//       error: (error) => {
//         this.isLoadingManagers = false;
//         this.error = error.message || 'Error loading roles';
//         console.error('Error loading roles:', error);
//         this.snackBar.open('Error loading roles: ' + this.error, 'Close', { duration: 3000 });
//       }
//     });
//   }

//   loadStoreData(id: string): void {
//     this.isLoading = true;
//     this.error = '';
    
//     this.storeService.getStore(id).subscribe({
//       next: (store) => {
//         // Patch form with store data
//         this.storeForm.patchValue({
//           name: store.name,
//           address: store.address,
//           city: store.city,
//           state: store.state,
//           zip_code: store.zip_code,
//           phone: store.phone,
//           email: store.email,
//           manager_id: store.manager_id || '',
//           is_active: store.is_active
//         });
//         this.isLoading = false;
//       },
//       error: (error) => {
//         this.isLoading = false;
//         this.error = error.message || 'Error loading store data';
//         console.error('Error loading store data:', error);
//         this.snackBar.open('Error loading store data: ' + this.error, 'Close', { duration: 3000 });
//       }
//     });
//   }

//   onSubmit(): void {
//     if (this.storeForm.invalid) {
//       return;
//     }

//     this.isSaving = true;
//     this.error = '';

//     if (this.isEditMode && this.storeId) {
//       const storeData: StoreUpdate = { ...this.storeForm.value };
      
//       // Handle manager_id - convert empty string to undefined for proper API handling
//       if (storeData.manager_id === '') {
//         storeData.manager_id = undefined;
//       }
      
//       this.storeService.updateStore(this.storeId, storeData).subscribe({
//         next: () => {
//           this.isSaving = false;
//           this.snackBar.open('Store updated successfully', 'Close', { duration: 3000 });
//           this.router.navigate(['/stores']);
//         },
//         error: (error) => {
//           this.isSaving = false;
//           this.error = error.message || 'Error updating store';
//           console.error('Error updating store:', error);
//           this.snackBar.open('Error updating store: ' + this.error, 'Close', { duration: 3000 });
//         }
//       });
//     } else {
//       const storeData: StoreCreate = { ...this.storeForm.value };
      
//       // Handle manager_id - convert empty string to undefined for proper API handling
//       if (storeData.manager_id === '') {
//         storeData.manager_id = undefined;
//       }
      
//       this.storeService.createStore(storeData).subscribe({
//         next: () => {
//           this.isSaving = false;
//           this.snackBar.open('Store created successfully', 'Close', { duration: 3000 });
//           this.router.navigate(['/stores']);
//         },
//         error: (error) => {
//           this.isSaving = false;
//           this.error = error.message || 'Error creating store';
//           console.error('Error creating store:', error);
//           this.snackBar.open('Error creating store: ' + this.error, 'Close', { duration: 3000 });
//         }
//       });
//     }
//   }
// }