// src/app/features/users/user-management/user-form/user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { UserService } from '../../../../core/services/user.service';
import { PermissionService } from '../../../../core/auth/permission.service';
import { User, UserWithPassword } from '../../../../shared/models/user.model';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [CommonModule, RouterLink, ReactiveFormsModule],
  template: `
    <div class="page-container">
      <div class="page-header">
        <h1 class="page-title">{{ isEditMode ? 'Edit User' : 'Create New User' }}</h1>
        <div class="flex flex-col sm:flex-row gap-4">
          <button routerLink="/users/management" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Users
          </button>
          
          <button *ngIf="isEditMode" [routerLink]="['/users/management', userId]" class="btn btn-outline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View User
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
      
      <!-- User form -->
      <div *ngIf="!loading" class="card">
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <!-- Full Name -->
            <div class="form-group">
              <label for="full_name" class="form-label required">Full Name</label>
              <input 
                type="text" 
                id="full_name" 
                formControlName="full_name"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['full_name'].errors}"
              >
              <div *ngIf="submitted && f['full_name'].errors" class="form-error">
                <div *ngIf="f['full_name'].errors['required']">Full name is required</div>
              </div>
            </div>
            
            <!-- Email -->
            <div class="form-group">
              <label for="email" class="form-label required">Email</label>
              <input 
                type="email" 
                id="email" 
                formControlName="email"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['email'].errors}"
              >
              <div *ngIf="submitted && f['email'].errors" class="form-error">
                <div *ngIf="f['email'].errors['required']">Email is required</div>
                <div *ngIf="f['email'].errors['email']">Please enter a valid email</div>
              </div>
            </div>
            
            <!-- Phone Number -->
            <div class="form-group">
              <label for="phone_number" class="form-label">Phone Number</label>
              <input 
                type="tel" 
                id="phone_number" 
                formControlName="phone_number"
                class="form-control"
              >
            </div>
            
            <!-- Role -->
            <div class="form-group">
              <label for="role_id" class="form-label required">Role</label>
              <select 
                id="role_id" 
                formControlName="role_id"
                class="form-control"
                [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['role_id'].errors}"
              >
                <option value="">Select a role</option>
                <option value="67c9fb4d9db05f47c32b6b22">Administrator</option>
                <option value="67c9fb4d9db05f47c32b6b23">Store Manager</option>
                <option value="67c9fb4d9db05f47c32b6b24">Employee</option>
              </select>
              <div *ngIf="submitted && f['role_id'].errors" class="form-error">
                <div *ngIf="f['role_id'].errors['required']">Role is required</div>
              </div>
            </div>
            
            <!-- Is Active -->
            <div class="form-group md:col-span-2">
              <div class="flex items-center">
                <input 
                  type="checkbox" 
                  id="is_active" 
                  formControlName="is_active"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800"
                >
                <label for="is_active" class="ml-2 block text-sm text-[var(--text-primary)]">
                  Active Account
                </label>
              </div>
              <p class="text-xs text-[var(--text-secondary)] mt-1">
                Active accounts can log in and access the system.
              </p>
            </div>
            
            <!-- Password fields (only for new users) -->
            <div *ngIf="!isEditMode" class="md:col-span-2 border-t border-[var(--border-color)] pt-6 mt-2">
              <h3 class="text-lg font-medium mb-4">Account Password</h3>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Password -->
                <div class="form-group">
                  <label for="password" class="form-label required">Password</label>
                  <div class="relative">
                    <input 
                      [type]="showPassword ? 'text' : 'password'" 
                      id="password" 
                      formControlName="password"
                      class="form-control pr-10"
                      [ngClass]="{'border-red-500 dark:border-red-400': submitted && f['password'].errors}"
                    >
                    <button 
                      type="button" 
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 focus:outline-none"
                      (click)="togglePasswordVisibility()"
                    >
                      <!-- Eye icon for show password -->
                      <svg *ngIf="!showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <!-- Eye-slash icon for hide password -->
                      <svg *ngIf="showPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>
                  <div *ngIf="submitted && f['password'].errors" class="form-error">
                    <div *ngIf="f['password'].errors['required']">Password is required</div>
                    <div *ngIf="f['password'].errors['minlength']">Password must be at least 8 characters</div>
                  </div>
                </div>
                
                <!-- Confirm Password -->
                <div class="form-group">
                  <label for="confirm_password" class="form-label required">Confirm Password</label>
                  <div class="relative">
                    <input 
                      [type]="showConfirmPassword ? 'text' : 'password'" 
                      id="confirm_password" 
                      formControlName="confirm_password"
                      class="form-control pr-10"
                      [ngClass]="{'border-red-500 dark:border-red-400': submitted && (f['confirm_password'].errors || passwordMismatch)}"
                    >
                    <button 
                      type="button" 
                      class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 dark:text-gray-400 focus:outline-none"
                      (click)="toggleConfirmPasswordVisibility()"
                    >
                      <!-- Eye icon for show password -->
                      <svg *ngIf="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <!-- Eye-slash icon for hide password -->
                      <svg *ngIf="showConfirmPassword" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    </button>
                  </div>
                  <div *ngIf="submitted && (f['confirm_password'].errors || passwordMismatch)" class="form-error">
                    <div *ngIf="f['confirm_password'].errors?.['required']">Please confirm your password</div>
                    <div *ngIf="passwordMismatch">Passwords do not match</div>
                  </div>
                </div>
                
                <!-- Password meter -->
                <div class="form-group md:col-span-2">
                  <div *ngIf="f['password'].value" class="mt-2">
                    <div class="flex justify-between mb-1">
                      <span class="text-xs font-medium text-[var(--text-secondary)]">Password Strength</span>
                      <span class="text-xs font-medium" [ngClass]="passwordStrengthClass">{{ passwordStrengthLabel }}</span>
                    </div>
                    <div class="w-full bg-gray-200 rounded-full h-1.5 dark:bg-gray-700">
                      <div class="h-1.5 rounded-full" [ngClass]="passwordStrengthBarClass" [style.width.%]="passwordStrength"></div>
                    </div>
                    <div class="mt-1 text-xs text-[var(--text-secondary)]">
                      <ul class="list-disc list-inside space-y-0.5">
                        <li [ngClass]="{'text-green-600 dark:text-green-500': hasLength}">At least 8 characters</li>
                        <li [ngClass]="{'text-green-600 dark:text-green-500': hasNumber}">Contains a number</li>
                        <li [ngClass]="{'text-green-600 dark:text-green-500': hasSpecial}">Contains a special character</li>
                        <li [ngClass]="{'text-green-600 dark:text-green-500': hasUpperLower}">Contains both uppercase and lowercase letters</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
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
              {{ isEditMode ? 'Update User' : 'Create User' }}
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
export class UserFormComponent implements OnInit {
  userForm: FormGroup;
  isEditMode = false;
  userId = '';
  loading = false;
  submitting = false;
  submitted = false;
  error = '';
  successMessage = '';
  passwordMismatch = false;
  
  // Password visibility toggles
  showPassword = false;
  showConfirmPassword = false;
  
  // Password strength
  passwordStrength = 0;
  passwordStrengthLabel = '';
  passwordStrengthClass = '';
  passwordStrengthBarClass = '';
  
  // Password criteria flags
  hasLength = false;
  hasNumber = false;
  hasSpecial = false;
  hasUpperLower = false;
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private permissionService: PermissionService
  ) {
    this.userForm = this.createUserForm();
  }
  
  ngOnInit(): void {
    // Check if in edit mode
    this.isEditMode = this.route.snapshot.data['isEdit'] === true;
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    
    if (this.isEditMode && this.userId) {
      this.loading = true;
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          this.updateFormWithUserData(user);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load user data. Please try again later.';
          this.loading = false;
          console.error('Error loading user:', err);
        }
      });
    }
    
    // Monitor password changes to check strength and match
    this.userForm.get('password')?.valueChanges.subscribe(() => {
      this.checkPasswordStrength();
      this.checkPasswordsMatch();
    });
    
    this.userForm.get('confirm_password')?.valueChanges.subscribe(() => {
      this.checkPasswordsMatch();
    });
  }
  
  // Convenience getter for form fields
  get f() { return this.userForm.controls; }
  
  createUserForm(): FormGroup {
    return this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: [''],
      role_id: ['', Validators.required],
      is_active: [true],
      // Password fields (only required for new users)
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      confirm_password: ['', this.isEditMode ? [] : [Validators.required]]
    });
  }
  
  updateFormWithUserData(user: User): void {
    this.userForm.patchValue({
      full_name: user.full_name,
      email: user.email,
      phone_number: user.phone_number || '',
      role_id: user.role_id || '',
      is_active: user.is_active
    });
    
    // Remove validators from password fields in edit mode
    if (this.isEditMode) {
      this.userForm.get('password')?.clearValidators();
      this.userForm.get('confirm_password')?.clearValidators();
      this.userForm.get('password')?.updateValueAndValidity();
      this.userForm.get('confirm_password')?.updateValueAndValidity();
    }
  }
  
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
  
  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }
  
  checkPasswordsMatch(): void {
    const password = this.f['password'].value;
    const confirmPassword = this.f['confirm_password'].value;
    
    if (password && confirmPassword) {
      this.passwordMismatch = password !== confirmPassword;
    } else {
      this.passwordMismatch = false;
    }
  }
  
  checkPasswordStrength(): void {
    const password = this.f['password'].value || '';
    
    // Reset criteria
    this.hasLength = password.length >= 8;
    this.hasNumber = /\d/.test(password);
    this.hasSpecial = /[^A-Za-z0-9]/.test(password);
    this.hasUpperLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
    
    // Calculate strength based on criteria
    let strength = 0;
    
    if (this.hasLength) strength += 25;
    if (this.hasNumber) strength += 25;
    if (this.hasSpecial) strength += 25;
    if (this.hasUpperLower) strength += 25;
    
    this.passwordStrength = strength;
    
    // Set label and classes based on strength
    if (strength === 0) {
      this.passwordStrengthLabel = '';
      this.passwordStrengthClass = '';
      this.passwordStrengthBarClass = '';
    } else if (strength <= 25) {
      this.passwordStrengthLabel = 'Weak';
      this.passwordStrengthClass = 'text-red-600 dark:text-red-500';
      this.passwordStrengthBarClass = 'bg-red-600 dark:bg-red-500';
    } else if (strength <= 50) {
      this.passwordStrengthLabel = 'Fair';
      this.passwordStrengthClass = 'text-orange-600 dark:text-orange-500';
      this.passwordStrengthBarClass = 'bg-orange-600 dark:bg-orange-500';
    } else if (strength <= 75) {
      this.passwordStrengthLabel = 'Good';
      this.passwordStrengthClass = 'text-yellow-600 dark:text-yellow-500';
      this.passwordStrengthBarClass = 'bg-yellow-600 dark:bg-yellow-500';
    } else {
      this.passwordStrengthLabel = 'Strong';
      this.passwordStrengthClass = 'text-green-600 dark:text-green-500';
      this.passwordStrengthBarClass = 'bg-green-600 dark:bg-green-500';
    }
  }
  
  resetForm(): void {
    if (this.isEditMode) {
      this.loading = true;
      this.userService.getUserById(this.userId).subscribe({
        next: (user) => {
          this.updateFormWithUserData(user);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to reset form. Please reload the page.';
          this.loading = false;
          console.error('Error resetting form:', err);
        }
      });
    } else {
      this.userForm.reset({
        is_active: true
      });
      this.submitted = false;
    }
  }
  
  onSubmit(): void {
    this.submitted = true;
    this.error = '';
    this.successMessage = '';
    
    // Check password match
    if (!this.isEditMode) {
      this.checkPasswordsMatch();
      if (this.passwordMismatch) {
        return;
      }
    }
    
    if (this.userForm.invalid) {
      return;
    }
    
    this.submitting = true;
    
    // Prepare data for API
    const userData: UserWithPassword = {
      full_name: this.f['full_name'].value,
      email: this.f['email'].value,
      phone_number: this.f['phone_number'].value,
      role_id: this.f['role_id'].value,
      is_active: this.f['is_active'].value
    };
    
    // Add password only if provided (required for new users)
    if (this.f['password'].value) {
      userData.password = this.f['password'].value;
    }
    
    if (this.isEditMode) {
      // Update existing user
      this.userService.updateUser(this.userId, userData).subscribe({
        next: (user) => {
          this.successMessage = 'User updated successfully.';
          this.submitting = false;
          
          // Redirect after a brief delay
          setTimeout(() => {
            this.router.navigate(['/users/management', this.userId]);
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to update user. Please try again later.';
          this.submitting = false;
          console.error('Error updating user:', err);
        }
      });
    } else {
      // Create new user
      this.userService.createUser(userData).subscribe({
        next: (user) => {
          this.successMessage = 'User created successfully.';
          this.submitting = false;
          
          // Redirect after a brief delay
          setTimeout(() => {
            if (user && user._id) {
              this.router.navigate(['/users/management', user._id]);
            } else {
              // If we don't have an ID, just go back to the user list
              this.router.navigate(['/users/management']);
            }
          }, 1500);
        },
        error: (err) => {
          this.error = err.message || 'Failed to create user. Please try again later.';
          this.submitting = false;
          console.error('Error creating user:', err);
        }
      });
    }
  }
}