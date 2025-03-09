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
    <div class="max-w-4xl mx-auto p-4">
      <div class="bg-white shadow-md rounded-lg overflow-hidden">
        <!-- Profile Header -->
        <div class="bg-primary-500 text-white p-6">
          <div class="flex items-center space-x-4">
            <div class="h-20 w-20 rounded-full bg-primary-300 flex items-center justify-center text-3xl font-bold">
              {{ userInitials }}
            </div>
            <div>
              <h1 class="text-2xl font-bold">{{ user?.full_name || 'User Profile' }}</h1>
              <p class="text-primary-100">{{ user?.email }}</p>
              <span class="inline-flex items-center px-3 py-1 mt-2 rounded-full text-xs font-medium bg-primary-700 text-white">
                {{ roleName }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- Profile Content -->
        <div class="p-6">
          <div class="mb-6">
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Profile Information</h2>
            
            <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" *ngIf="profileForm">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label for="full_name" class="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input 
                    type="text" 
                    id="full_name" 
                    formControlName="full_name"
                    class="form-control"
                    [ngClass]="{'border-red-500': submitted && f['full_name'].errors}"
                  >
                  <div *ngIf="submitted && f['full_name'].errors" class="mt-1 text-red-500 text-xs">
                    <div *ngIf="f['full_name'].errors['required']">Full name is required</div>
                  </div>
                </div>
                
                <div>
                  <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    id="email" 
                    formControlName="email"
                    class="form-control"
                    [ngClass]="{'border-red-500': submitted && f['email'].errors}"
                  >
                  <div *ngIf="submitted && f['email'].errors" class="mt-1 text-red-500 text-xs">
                    <div *ngIf="f['email'].errors['required']">Email is required</div>
                    <div *ngIf="f['email'].errors['email']">Please enter a valid email</div>
                  </div>
                </div>
                
                <div>
                  <label for="phone_number" class="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    id="phone_number" 
                    formControlName="phone_number"
                    class="form-control"
                  >
                </div>
                
                <div>
                  <label for="role" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
                  <input 
                    type="text" 
                    id="role" 
                    [value]="roleName"
                    class="form-control"
                    disabled
                  >
                </div>
              </div>
              
              <div class="flex justify-center mt-6">
                <button 
                  type="submit"
                  class="btn bg-primary-500 hover:bg-primary-600 text-white px-6 py-2 rounded-md"
                  [disabled]="loading"
                >
                  <span *ngIf="loading" class="mr-2">
                    <!-- Loading spinner icon -->
                    <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  Update Profile
                </button>
              </div>
            </form>
          </div>
          
          <div class="mt-8 border-t pt-6">
            <h2 class="text-lg font-semibold text-gray-700 mb-4">Security</h2>
            
            <button 
              class="btn bg-secondary-500 hover:bg-secondary-600 text-white px-6 py-2 rounded-md"
              (click)="openChangePasswordModal()"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
      
      <!-- Success message -->
      <div *ngIf="successMessage" class="mt-4 p-3 bg-accent-100 text-accent-800 rounded-md">
        {{ successMessage }}
      </div>
      
      <!-- Error message -->
      <div *ngIf="errorMessage" class="mt-4 p-3 bg-danger-100 text-danger-800 rounded-md">
        {{ errorMessage }}
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileForm: FormGroup | null = null;
  loading = false;
  submitted = false;
  successMessage = '';
  errorMessage = '';
  roleName = 'Employee';

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private formBuilder: FormBuilder,
    private router: Router
  ) {}

  ngOnInit(): void {
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

    this.profileForm = this.formBuilder.group({
      full_name: [this.user.full_name, Validators.required],
      email: [this.user.email, [Validators.required, Validators.email]],
      phone_number: [this.user.phone_number || '']
    });
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
    
    if (this.profileForm?.invalid) {
      return;
    }
    
    this.loading = true;
    this.successMessage = '';
    this.errorMessage = '';
    
    if (!this.user) {
      this.errorMessage = 'User profile not found.';
      this.loading = false;
      return;
    }
    
    const userData = {
      ...this.profileForm?.value
    };
    
    this.userService.updateUser(this.user._id, userData).subscribe({
      next: (updatedUser) => {
        this.loading = false;
        this.successMessage = 'Profile updated successfully!';
        // Update local user data
        this.user = updatedUser;
        // Update auth service user data
        localStorage.setItem('user', JSON.stringify(updatedUser));
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.message || 'Failed to update profile.';
        console.error('Error updating user:', error);
      }
    });
  }

  openChangePasswordModal(): void {
    // This would open a modal with password change form
    // For simplicity, we're just showing a notification for now
    this.successMessage = 'Password change feature will be implemented in the next update.';
  }
}