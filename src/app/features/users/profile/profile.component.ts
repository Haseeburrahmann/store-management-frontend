// src/app/features/users/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';
import { PermissionService } from '../../../core/auth/permission.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">My Profile</h1>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Profile Overview Card -->
        <div class="card col-span-1">
          <div class="flex flex-col items-center justify-center text-center">
            <div class="h-24 w-24 rounded-full bg-slate-600 dark:bg-slate-700 flex items-center justify-center text-white text-2xl font-bold mb-4">
              {{ userInitials }}
            </div>
            <h2 class="text-xl font-bold">{{ user?.full_name || 'Loading...' }}</h2>
            <p class="text-sm text-[var(--text-secondary)]">{{ user?.email || 'Loading...' }}</p>
            
            <div class="badge badge-info mt-2">{{ roleName }}</div>
            
            <div class="w-full mt-6 pt-6 border-t border-[var(--border-color)]">
              <div class="grid grid-cols-1 gap-4">
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Phone Number</span>
                  <span>{{ user?.phone_number || 'Not provided' }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Account Status</span>
                  <span class="flex items-center">
                    <span 
                      class="w-2 h-2 rounded-full mr-2" 
                      [ngClass]="user?.is_active ? 'bg-green-500' : 'bg-red-500'"
                    ></span>
                    {{ user?.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
                <div class="flex flex-col">
                  <span class="text-xs text-[var(--text-secondary)]">Member Since</span>
                  <span>{{ user?.created_at | date:'mediumDate' }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Profile Edit Form -->
        <div class="card col-span-1 lg:col-span-2">
          <h2 class="text-xl font-bold mb-6">Edit Profile Information</h2>
          
          <!-- Permission denied message -->
          <div *ngIf="!canUpdateProfile" class="alert alert-warning mb-6">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium">You don't have permission to update your profile. Please contact an administrator for assistance.</p>
              </div>
            </div>
          </div>
          
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" *ngIf="profileForm && canUpdateProfile">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-group">
                <label for="full_name" class="form-label required">Full Name</label>
                <input 
                  type="text" 
                  id="full_name" 
                  formControlName="full_name"
                  class="form-control"
                  [ngClass]="{'border-red-500': submitted && f['full_name'].errors}"
                >
                <div *ngIf="submitted && f['full_name'].errors" class="form-error">
                  <div *ngIf="f['full_name'].errors['required']">Full name is required</div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="email" class="form-label required">Email</label>
                <input 
                  type="email" 
                  id="email" 
                  formControlName="email"
                  class="form-control"
                  [ngClass]="{'border-red-500': submitted && f['email'].errors}"
                >
                <div *ngIf="submitted && f['email'].errors" class="form-error">
                  <div *ngIf="f['email'].errors['required']">Email is required</div>
                  <div *ngIf="f['email'].errors['email']">Please enter a valid email</div>
                </div>
              </div>
              
              <div class="form-group">
                <label for="phone_number" class="form-label">Phone Number</label>
                <input 
                  type="text" 
                  id="phone_number" 
                  formControlName="phone_number"
                  class="form-control"
                >
              </div>
              
              <div class="form-group">
                <label for="role" class="form-label">Role</label>
                <input 
                  type="text" 
                  id="role" 
                  [value]="roleName"
                  class="form-control"
                  disabled
                >
              </div>
            </div>
            
            <div class="mt-8 border-t border-[var(--border-color)] pt-6">
              <h2 class="text-lg font-semibold text-gray-700 mb-4">Account Information</h2>
              
              <div class="text-sm text-gray-600">
                <p>Account created: {{ user?.created_at | date:'mediumDate' }}</p>
                <p>Last updated: {{ user?.updated_at | date:'mediumDate' }}</p>
              </div>
            </div>
            
            <div class="flex justify-end space-x-4 mt-6">
              <button 
                type="button" 
                class="btn btn-outline"
                (click)="resetForm()"
              >
                Reset
              </button>
              
              <button 
                type="submit"
                class="btn btn-primary"
                [disabled]="loading"
              >
                <span *ngIf="loading" class="mr-2">
                  <!-- Loading spinner -->
                  <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
                Save Changes
              </button>
            </div>
          </form>
          
          <!-- Read-only profile view when user can't edit -->
          <div *ngIf="!canUpdateProfile && user">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div class="form-group">
                <label class="form-label">Full Name</label>
                <div class="p-2 bg-slate-50 dark:bg-slate-700 rounded">{{ user.full_name }}</div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Email</label>
                <div class="p-2 bg-slate-50 dark:bg-slate-700 rounded">{{ user.email }}</div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Phone Number</label>
                <div class="p-2 bg-slate-50 dark:bg-slate-700 rounded">{{ user.phone_number || 'Not provided' }}</div>
              </div>
              
              <div class="form-group">
                <label class="form-label">Role</label>
                <div class="p-2 bg-slate-50 dark:bg-slate-700 rounded">{{ roleName }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Notification messages -->
      <div class="mt-6">
        <!-- Success message -->
        <div *ngIf="successMessage" class="alert alert-success">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">{{ successMessage }}</p>
            </div>
            <div class="ml-auto pl-3">
              <div class="-mx-1.5 -my-1.5">
                <button 
                  type="button" 
                  class="inline-flex rounded-md p-1.5 text-green-500 hover:bg-green-100 focus:outline-none"
                  (click)="successMessage = ''"
                >
                  <span class="sr-only">Dismiss</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Error message -->
        <div *ngIf="errorMessage" class="alert alert-danger">
          <div class="flex">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium">{{ errorMessage }}</p>
            </div>
            <div class="ml-auto pl-3">
              <div class="-mx-1.5 -my-1.5">
                <button 
                  type="button" 
                  class="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none"
                  (click)="errorMessage = ''"
                >
                  <span class="sr-only">Dismiss</span>
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
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
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup | null = null;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  roleName = 'Employee';
  canUpdateProfile = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private permissionService: PermissionService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    this.checkPermissions();
  }

  private checkPermissions(): void {
    // Check if the user has permission to update their own profile
    // Usually users can update their own basic info, but this depends on your permission system
    this.canUpdateProfile = this.permissionService.hasPermission('users:write') || 
                            this.permissionService.isAdmin() ||
                            this.permissionService.isManager();
    
    // If none of the above permissions are present, check if users can at least update their own profile
    if (!this.canUpdateProfile) {
      // Some systems might have a specific permission for updating own profile
      this.canUpdateProfile = this.permissionService.hasPermission('profile:write');
    }

    // If still no permissions, one final check - if user has any write permissions at all
    if (!this.canUpdateProfile) {
      // Look for any permissions that end with ":write"
      const allPermissions = this.permissionService.userPermissionsSubject.value;
      this.canUpdateProfile = allPermissions.some(perm => perm.endsWith(':write'));
    }
    
    console.log('User can update profile:', this.canUpdateProfile);
  }

  private loadUserData(): void {
    // First try to get user from auth service
    this.user = this.authService.currentUser;
    
    if (!this.user) {
      // If user is not loaded yet, try to fetch from API
      this.userService.getCurrentUser().subscribe({
        next: (user) => {
          this.user = user;
          this.initForm();
          this.determineRoleName();
        },
        error: (error) => {
          this.errorMessage = 'Failed to load user profile.';
          console.error('Error fetching user:', error);
        }
      });
    } else {
      this.initForm();
      this.determineRoleName();
    }
  }

  private initForm(): void {
    if (!this.user) {
      console.error('Cannot initialize form: User data is missing');
      return;
    }

    // Ensure we're correctly accessing the phone_number property
    console.log('User data for form initialization:', this.user);
    
    this.profileForm = this.formBuilder.group({
      full_name: [this.user.full_name, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone_number: [this.user.phone_number || '']
    });
    
    // Verify form values after initialization
    console.log('Form values after initialization:', this.profileForm.value);
  }

  private determineRoleName(): void {
    // Determine role name based on role_id
    if (this.user?.role_id) {
      if (this.user.role_id === '67c9fb4d9db05f47c32b6b22') {
        this.roleName = 'Administrator';
      } else if (this.user.role_id === '67c9fb4d9db05f47c32b6b23') {
        this.roleName = 'Store Manager';
      } else {
        this.roleName = 'Employee';
      }
    }
  }

  get f() { 
    return this.profileForm?.controls || {}; 
  }

  get userInitials(): string {
    if (!this.user?.full_name) return 'U';
    
    const names = this.user.full_name.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  onSubmit(): void {
    this.submitted = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    // Check permissions before proceeding
    if (!this.canUpdateProfile) {
      this.errorMessage = 'You do not have permission to update your profile.';
      return;
    }
    
    // Validate form
    if (this.profileForm?.invalid) {
      return;
    }
    
    this.loading = true;
    
    if (!this.user) {
      this.errorMessage = 'User profile not found.';
      this.loading = false;
      return;
    }
    
    // Update user profile
    const userData = {
      full_name: this.f['full_name'].value,
      email: this.f['email'].value,
      phone_number: this.f['phone_number'].value
    };
    
    console.log('Updating user profile with data:', userData);
    
    this.userService.updateUser(this.user._id, userData).subscribe({
      next: (updatedUser) => {
        console.log('Profile updated successfully:', updatedUser);
        this.loading = false;
        this.successMessage = 'Profile updated successfully!';
        
        // Update local user data
        if (updatedUser) {
          this.user = updatedUser;
          
          try {
            // Update auth service user data safely
            const storedUserJson = localStorage.getItem('user');
            if (storedUserJson) {
              const storedUser = JSON.parse(storedUserJson);
              const mergedUser = { 
                ...storedUser,
                full_name: updatedUser.full_name,
                email: updatedUser.email,
                phone_number: updatedUser.phone_number,
                updated_at: updatedUser.updated_at
              };
              
              // Save back to localStorage
              localStorage.setItem('user', JSON.stringify(mergedUser));
              
              // Force a reload of the current user
              console.log('Refreshing user data in auth service');
              this.authService.fetchCurrentUser().subscribe({
                next: () => console.log('Auth service user data refreshed'),
                error: (err) => console.error('Failed to refresh auth service user data', err)
              });
            }
          } catch (error) {
            console.error('Error updating user in localStorage:', error);
            // Non-critical error, don't show to user
          }
        } else {
          console.warn('Backend returned empty user object after update');
        }
      },
      error: (error) => {
        this.loading = false;
        
        // Check if the error is due to permissions
        if (error.status === 403) {
          this.errorMessage = 'You do not have permission to update your profile.';
          this.canUpdateProfile = false;  // Update the permission flag
        } else {
          this.errorMessage = error.message || 'Failed to update profile.';
        }
        
        console.error('Error updating user:', error);
      }
    });
  }

  resetForm(): void {
    if (!this.user) return;
    
    this.submitted = false;
    
    // Reload user data to ensure we have the latest
    this.loadUserData();
  }
}