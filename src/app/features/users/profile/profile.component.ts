// src/app/features/users/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { UserService } from '../../../core/services/user.service';
import { User } from '../../../shared/models/user.model';

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
          
          <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" *ngIf="profileForm">
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
              <h3 class="text-lg font-semibold mb-4">Change Password</h3>
              
              <!-- <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div class="form-group">
                  <label for="current_password" class="form-label">Current Password</label>
                  <input 
                    type="password" 
                    id="current_password" 
                    formControlName="current_password"
                    class="form-control"
                    [ngClass]="{'border-red-500': submitted && passwordChangeRequested && f['current_password'].errors}"
                  >
                  <div *ngIf="submitted && passwordChangeRequested && f['current_password'].errors" class="form-error">
                    <div *ngIf="f['current_password'].errors['required']">Current password is required to change password</div>
                  </div>
                </div>
                
                <div></div> 
                
                <div class="form-group">
                  <label for="new_password" class="form-label">New Password</label>
                  <input 
                    type="password" 
                    id="new_password" 
                    formControlName="new_password"
                    class="form-control"
                    [ngClass]="{'border-red-500': submitted && passwordChangeRequested && f['new_password'].errors}"
                  >
                  <div *ngIf="submitted && passwordChangeRequested && f['new_password'].errors" class="form-error">
                    <div *ngIf="f['new_password'].errors['required']">New password is required</div>
                    <div *ngIf="f['new_password'].errors['minlength']">Password must be at least 8 characters</div>
                  </div>
                </div>
                
                <div class="form-group">
                  <label for="confirm_password" class="form-label">Confirm New Password</label>
                  <input 
                    type="password" 
                    id="confirm_password" 
                    formControlName="confirm_password"
                    class="form-control"
                    [ngClass]="{'border-red-500': submitted && passwordChangeRequested && (f['confirm_password'].errors || passwordMismatch)}"
                  >
                  <div *ngIf="submitted && passwordChangeRequested && (f['confirm_password'].errors || passwordMismatch)" class="form-error">
                    <div *ngIf="f['confirm_password'].errors?.['required']">Please confirm your password</div>
                    <div *ngIf="passwordMismatch">Passwords do not match</div>
                  </div>
                </div>
              </div> -->
              <div class="mt-8 border-t pt-6">
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Account Information</h2>
            
            <div class="text-sm text-gray-600">
              <p>Account created: {{ user?.created_at | date:'mediumDate' }}</p>
              <p>Last updated: {{ user?.updated_at | date:'mediumDate' }}</p>
            </div>
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
  passwordMismatch = false;
  passwordChangeRequested = false;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
    debugger;
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
    if (!this.user) return;

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
    // This is a placeholder - ideally you would get the role name from your API
    // For now we'll determine based on role_id pattern
    if (this.user?.role_id) {
      const roleId = this.user.role_id.toLowerCase();
      if (roleId.includes('admin')) {
        this.roleName = 'Administrator';
      } else if (roleId.includes('manager')) {
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
    this.passwordMismatch = false;
    
    // Check if a password change was requested
    this.passwordChangeRequested = this.f['current_password'].value || 
                                 this.f['new_password'].value || 
                                 this.f['confirm_password'].value;
    
    // Validate form
    if (this.profileForm?.invalid) {
      return;
    }
    
    // Check if passwords match if password change was requested
    if (this.passwordChangeRequested) {
      if (!this.f['current_password'].value) {
        this.f['current_password'].setErrors({ required: true });
        return;
      }
      
      if (!this.f['new_password'].value) {
        this.f['new_password'].setErrors({ required: true });
        return;
      }
      
      if (!this.f['confirm_password'].value) {
        this.f['confirm_password'].setErrors({ required: true });
        return;
      }
      
      if (this.f['new_password'].value !== this.f['confirm_password'].value) {
        this.passwordMismatch = true;
        return;
      }
    }
    
    this.loading = true;
    
    if (!this.user) {
      this.errorMessage = 'User profile not found.';
      this.loading = false;
      return;
    }
    
    // Update user profile (excluding password fields)
    const userData = {
      full_name: this.f['full_name'].value,
      email: this.f['email'].value,
      phone_number: this.f['phone_number'].value
    };
    
    this.userService.updateUser(this.user._id, userData).subscribe({
      next: (updatedUser) => {
        // Update local user data
        this.user = updatedUser;
        
        // Update auth service user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // Handle password change if requested
        if (this.passwordChangeRequested) {
          this.changePassword();
        } else {
          this.loading = false;
          this.successMessage = 'Profile updated successfully!';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Failed to update profile.';
        console.error('Error updating user:', error);
      }
    });
  }
  
  changePassword(): void {
    if (!this.passwordChangeRequested) return;
    
    this.userService.changePassword(
      this.f['current_password'].value,
      this.f['new_password'].value
    ).subscribe({
      next: () => {
        this.loading = false;
        this.successMessage = 'Profile and password updated successfully!';
        
        // Clear password fields
        this.f['current_password'].setValue('');
        this.f['new_password'].setValue('');
        this.f['confirm_password'].setValue('');
        this.passwordChangeRequested = false;
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Failed to change password. Profile was updated.';
        console.error('Error changing password:', error);
      }
    });
  }

  resetForm(): void {
    if (!this.user) return;
    
    this.submitted = false;
    this.passwordChangeRequested = false;
    this.passwordMismatch = false;
    
    // Reset form to original values
    this.initForm();
  }
}