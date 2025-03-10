// src/app/features/stores/store-management/store-form/store-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { StoreService } from '../../../../core/services/store.service';
import { UserService } from '../../../../core/services/user.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { Store } from '../../../../shared/models/store.model';
import { User } from '../../../../shared/models/user.model';
import { HasPermissionDirective } from '../../../../shared/directives/has-permission.directive';

@Component({
  selector: 'app-store-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule, HasPermissionDirective],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? 'Edit Store' : 'Create New Store' }}</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/stores" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Stores
          </button>
          
          <button *ngIf="isEditMode" [routerLink]="['/stores', storeId]" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Store
          </button>
        </div>
      </div>
      
      <!-- Loading state -->
      <div *ngIf="loading" class="flex justify-center items-center p-8">
        <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-500"></div>
      </div>
      
      <!-- Error message -->
      <div *ngIf="error" class="alert alert-danger mb-6">
        {{ error }}
      </div>
      
      <!-- Success message -->
      <div *ngIf="successMessage" class="alert alert-success mb-6">
        {{ successMessage }}
      </div>
      
      <!-- Store form -->
      <div *ngIf="!loading" class="card">
        <form [formGroup]="storeForm" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Store Name -->
            <div class="form-group">
              <label for="name" class="form-label required">Store Name</label>
              <input 
                type="text" 
                id="name" 
                formControlName="name"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['name'].errors}"
              >
              <div *ngIf="submitted && f['name'].errors" class="form-error">
                <div *ngIf="f['name'].errors['required']">Store name is required</div>
              </div>
            </div>
            
            <!-- Address -->
            <div class="form-group">
              <label for="address" class="form-label required">Address</label>
              <input 
                type="text" 
                id="address" 
                formControlName="address"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['address'].errors}"
              >
              <div *ngIf="submitted && f['address'].errors" class="form-error">
                <div *ngIf="f['address'].errors['required']">Address is required</div>
              </div>
            </div>
            
            <!-- City -->
            <div class="form-group">
              <label for="city" class="form-label required">City</label>
              <input 
                type="text" 
                id="city" 
                formControlName="city"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['city'].errors}"
              >
              <div *ngIf="submitted && f['city'].errors" class="form-error">
                <div *ngIf="f['city'].errors['required']">City is required</div>
              </div>
            </div>
            
            <!-- State -->
            <div class="form-group">
              <label for="state" class="form-label required">State</label>
              <input 
                type="text" 
                id="state" 
                formControlName="state"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['state'].errors}"
              >
              <div *ngIf="submitted && f['state'].errors" class="form-error">
                <div *ngIf="f['state'].errors['required']">State is required</div>
              </div>
            </div>
            
            <!-- Zip Code -->
            <div class="form-group">
              <label for="zip_code" class="form-label required">Zip Code</label>
              <input 
                type="text" 
                id="zip_code" 
                formControlName="zip_code"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['zip_code'].errors}"
              >
              <div *ngIf="submitted && f['zip_code'].errors" class="form-error">
                <div *ngIf="f['zip_code'].errors['required']">Zip code is required</div>
                <div *ngIf="f['zip_code'].errors['pattern']">Please enter a valid zip code</div>
              </div>
            </div>
            
            <!-- Phone -->
            <div class="form-group">
              <label for="phone" class="form-label required">Phone</label>
              <input 
                type="tel" 
                id="phone" 
                formControlName="phone"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['phone'].errors}"
              >
              <div *ngIf="submitted && f['phone'].errors" class="form-error">
                <div *ngIf="f['phone'].errors['required']">Phone is required</div>
              </div>
            </div>
            
            <!-- Email -->
            <div class="form-group">
              <label for="email" class="form-label">Email</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['email'].errors}"
              >
              <div *ngIf="submitted && f['email'].errors" class="form-error">
                <div *ngIf="f['email'].errors['email']">Please enter a valid email</div>
              </div>
            </div>
            
            <!-- Manager -->
            <div class="form-group">
              <label for="manager_id" class="form-label">Manager</label>
              <select 
                id="manager_id" 
                formControlName="manager_id"
                class="form-control"
              >
                <option value="">Select a manager</option>
                <option *ngFor="let manager of availableManagers" [value]="manager._id">
                  {{ manager.full_name }} ({{ manager.email }})
                </option>
              </select>
            </div>
            
            <!-- Is Active -->
            <div class="form-group">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  formControlName="is_active"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                >
                <label for="is_active" class="ml-2 block text-sm text-[var(--text-primary)]">
                  Active Store
                </label>
              </div>
              <p class="text-xs text-[var(--text-secondary)] mt-1">
                Active stores are operational and can be assigned employees.
              </p>
            </div>
          </div>
          
          <div class="flex justify-end space-x-4 mt-6 pt-6 border-t border-[var(--border-color)]">
            <button 
              type="button" 
              class="btn btn-outline"
              (click)="resetForm()"
              [disabled]="submitting"
            >
              Reset
            </button>
            
            <button 
              type="submit"
              class="btn btn-primary"
              [disabled]="submitting"
            >
              <span *ngIf="submitting" class="mr-2">
                <!-- Loading spinner -->
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ isEditMode ? 'Update Store' : 'Create Store' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .required:after {
      content: " *";
      color: #ef4444;
    }
  `]
})
export class StoreFormComponent implements OnInit {
  storeForm: FormGroup;
  isEditMode = false;
  storeId = '';
  loading = false;
  submitting = false;
  submitted = false;
  error = '';
  successMessage = '';
  
  // Available managers for assignment
  availableManagers: User[] = [];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private storeService: StoreService,
    private userService: UserService,
    private permissionService: PermissionService
  ) {
    this.storeForm = this.createStoreForm();
  }
  
  ngOnInit(): void {
    // Check if in edit mode
    this.isEditMode = this.route.snapshot.data['isEdit'] === true;
    this.storeId = this.route.snapshot.paramMap.get('id') || '';
    
    // Load managers for assignment
    this.loadManagers();
    
    if (this.isEditMode && this.storeId) {
      this.loading = true;
      this.storeService.getStoreById(this.storeId).subscribe({
        next: (store) => {
          this.updateFormWithStoreData(store);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load store data. Please try again later.';
          this.loading = false;
          console.error('Error loading store:', err);
        }
      });
    }
  }
  
  // Convenience getter for form fields
  get f() { return this.storeForm.controls; }
  
  createStoreForm(): FormGroup {
    return this.fb.group({
      name: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip_code: ['', [Validators.required, Validators.pattern(/^\d{5}(-\d{4})?$/)]],
      phone: ['', Validators.required],
      email: ['', [Validators.email]],
      manager_id: [''],
      is_active: [true]
    });
  }
  
  updateFormWithStoreData(store: Store): void {
    this.storeForm.patchValue({
      name: store.name,
      address: store.address,
      city: store.city,
      state: store.state,
      zip_code: store.zip_code,
      phone: store.phone,
      email: store.email || '',
      manager_id: store.manager_id || '',
      is_active: store.is_active
    });
  }
  
  loadManagers(): void {
    debugger;
    // Specifically get users with Manager role (role_id for manager)
    this.userService.getUsers({ role_id: '67c9fb4d9db05f47c32b6b23' }).subscribe({
      next: (managers) => {
        this.availableManagers = managers;
        console.log('Loaded managers:', managers.length);
        
        // If we're in edit mode and already have a selected manager_id,
        // make sure that manager is in the list
        if (this.isEditMode && this.storeForm.get('manager_id')?.value) {
          const selectedManagerId = this.storeForm.get('manager_id')?.value;
          const managerExists = this.availableManagers.some(m => m._id === selectedManagerId);
          
          // If the manager isn't in our list (perhaps they changed roles), 
          // fetch them specifically
          if (!managerExists && selectedManagerId) {
            this.userService.getUserById(selectedManagerId).subscribe({
              next: (manager) => {
                if (manager) {
                  // Add this manager to the available managers list
                  this.availableManagers = [...this.availableManagers, manager];
                }
              },
              error: (err) => {
                console.error('Error loading assigned manager:', err);
              }
            });
          }
        }
      },
      error: (err) => {
        console.error('Error loading managers:', err);
      }
    });
  }
  
  resetForm(): void {
    if (this.isEditMode) {
      // Reload store data
      this.loading = true;
      this.storeService.getStoreById(this.storeId).subscribe({
        next: (store) => {
          this.updateFormWithStoreData(store);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to reset form. Please reload the page.';
          this.loading = false;
          console.error('Error resetting form:', err);
        }
      });
    } else {
      // Create mode - just reset the form
      this.storeForm.reset({
        is_active: true
      });
      this.submitted = false;
    }
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.successMessage = '';
    
    if (this.storeForm.invalid) {
      return;
    }
    
    this.submitting = true;
    
    // Prepare data for API
    const storeData: Partial<Store> = {
      name: this.f['name'].value,
      address: this.f['address'].value,
      city: this.f['city'].value,
      state: this.f['state'].value,
      zip_code: this.f['zip_code'].value,
      phone: this.f['phone'].value,
      email: this.f['email'].value,
      manager_id: this.f['manager_id'].value || null,
      is_active: this.f['is_active'].value
    };
    
    if (this.isEditMode) {
      // Update existing store
      this.storeService.updateStore(this.storeId, storeData).subscribe({
        next: (store) => {
          this.successMessage = 'Store updated successfully.';
          this.submitting = false;
          
          // Redirect after a brief delay
          setTimeout(() => {
            this.router.navigate(['/stores', this.storeId]);
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to update store. Please try again later.';
          this.submitting = false;
          console.error('Error updating store:', err);
        }
      });
    } else {
      // Create new store
      this.storeService.createStore(storeData).subscribe({
        next: (store) => {
          this.successMessage = 'Store created successfully.';
          this.submitting = false;
          
          // Redirect after a brief delay
          setTimeout(() => {
            if (store && store._id) {
              this.router.navigate(['/stores', store._id]);
            } else {
              // If we don't have an ID, just go back to the store list
              this.router.navigate(['/stores']);
            }
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to create store. Please try again later.';
          this.submitting = false;
          console.error('Error creating store:', err);
        }
      });
    }
  }
}