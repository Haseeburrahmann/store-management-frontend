// src/app/features/auth/profile/profile.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { User } from '../../../shared/models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTabsModule,
    MatDividerModule,
    ErrorDisplayComponent,
    CardContainerComponent,
    PageHeaderComponent
  ],
  template: `
    <div class="profile-container">
      <app-page-header 
        title="My Profile" 
        subtitle="View and update your profile information">
      </app-page-header>
      
      <div *ngIf="user" class="profile-content">
        <app-card-container>
          <mat-tab-group>
            <mat-tab label="Profile Information">
              <div class="tab-content">
                <app-error-display
                  [visible]="error !== ''"
                  [message]="error"
                  type="error">
                </app-error-display>
                
                <form [formGroup]="profileForm" (ngSubmit)="updateProfile()" class="profile-form">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Full Name</mat-label>
                    <input 
                      matInput 
                      formControlName="full_name" 
                      placeholder="Enter your full name"
                      required>
                    <mat-icon matSuffix>person</mat-icon>
                    <mat-error *ngIf="pf['full_name']?.errors?.['required']">Full name is required</mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Email</mat-label>
                    <input 
                      matInput 
                      formControlName="email" 
                      placeholder="Enter your email"
                      required>
                    <mat-icon matSuffix>email</mat-icon>
                   <mat-error *ngIf="pf['email']?.errors?.['required']">Email is required</mat-error>
                    <mat-error *ngIf="pf['email']?.errors?.['email']">Please enter a valid email</mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Phone Number</mat-label>
                    <input 
                      matInput 
                      formControlName="phone_number" 
                      placeholder="Enter your phone number">
                    <mat-icon matSuffix>phone</mat-icon>
                  </mat-form-field>
                  
                  <div class="form-actions">
                    <button 
                      mat-flat-button 
                      color="primary" 
                      type="submit"
                      [disabled]="updateLoading || profileForm.invalid || !profileForm.dirty"
                      class="submit-button">
                      <mat-spinner diameter="20" *ngIf="updateLoading"></mat-spinner>
                      <span *ngIf="!updateLoading">Update Profile</span>
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>
            
            <mat-tab label="Change Password">
              <div class="tab-content">
                <app-error-display
                  [visible]="passwordError !== ''"
                  [message]="passwordError"
                  type="error">
                </app-error-display>
                
                <form [formGroup]="passwordForm" (ngSubmit)="updatePassword()" class="password-form">
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Current Password</mat-label>
                    <input 
                      matInput 
                      [type]="hideCurrentPassword ? 'password' : 'text'" 
                      formControlName="currentPassword"
                      placeholder="Enter your current password"
                      required>
                    <button 
                      type="button"
                      mat-icon-button 
                      matSuffix 
                      (click)="hideCurrentPassword = !hideCurrentPassword">
                      <mat-icon>{{hideCurrentPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                    </button>
                    <mat-error *ngIf="pwf['currentPassword?'].errors?.['required']">Current password is required</mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>New Password</mat-label>
                    <input 
                      matInput 
                      [type]="hideNewPassword ? 'password' : 'text'" 
                      formControlName="newPassword"
                      placeholder="Enter your new password"
                      required>
                    <button 
                      type="button"
                      mat-icon-button 
                      matSuffix 
                      (click)="hideNewPassword = !hideNewPassword">
                      <mat-icon>{{hideNewPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                    </button>
                    <mat-error *ngIf="pwf['newPassword?'].errors?.['required']">New password is required</mat-error>
                    <mat-error *ngIf="pwf['newPassword?'].errors?.['minlength']">Password must be at least 8 characters</mat-error>
                  </mat-form-field>
                  
                  <mat-form-field appearance="outline" class="form-field">
                    <mat-label>Confirm New Password</mat-label>
                    <input 
                      matInput 
                      [type]="hideConfirmPassword ? 'password' : 'text'" 
                      formControlName="confirmPassword"
                      placeholder="Confirm your new password"
                      required>
                    <button 
                      type="button"
                      mat-icon-button 
                      matSuffix 
                      (click)="hideConfirmPassword = !hideConfirmPassword">
                      <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                    </button>
                    <mat-error *ngIf="pwf['confirmPassword?'].errors?.['required']">Confirm password is required</mat-error>
                    <mat-error *ngIf="pwf['confirmPassword?'].errors?.['mustMatch']">Passwords must match</mat-error>
                  </mat-form-field>
                  
                  <div class="form-actions">
                    <button 
                      mat-flat-button 
                      color="primary" 
                      type="submit"
                      [disabled]="passwordLoading || passwordForm.invalid"
                      class="submit-button">
                      <mat-spinner diameter="20" *ngIf="passwordLoading"></mat-spinner>
                      <span *ngIf="!passwordLoading">Change Password</span>
                    </button>
                  </div>
                </form>
              </div>
            </mat-tab>
            
            <mat-tab label="Account Info">
              <div class="tab-content">
                <div class="account-info">
                  <div class="info-group">
                    <div class="info-label">User ID:</div>
                    <div class="info-value">{{ user._id }}</div>
                  </div>
                  
                  <mat-divider></mat-divider>
                  
                  <div class="info-group">
                    <div class="info-label">Role:</div>
                    <div class="info-value">{{ user.role_name || 'N/A' }}</div>
                  </div>
                  
                  <mat-divider></mat-divider>
                  
                  <div class="info-group">
                    <div class="info-label">Account Status:</div>
                    <div class="info-value status" [ngClass]="{'active': user.is_active, 'inactive': !user.is_active}">
                      {{ user.is_active ? 'Active' : 'Inactive' }}
                    </div>
                  </div>
                  
                  <mat-divider></mat-divider>
                  
                  <div class="info-group">
                    <div class="info-label">Created:</div>
                    <div class="info-value">{{ user.created_at | date:'medium' }}</div>
                  </div>
                  
                  <mat-divider></mat-divider>
                  
                  <div class="info-group">
                    <div class="info-label">Last Updated:</div>
                    <div class="info-value">{{ user.updated_at | date:'medium' }}</div>
                  </div>
                </div>
              </div>
            </mat-tab>
          </mat-tab-group>
        </app-card-container>
      </div>
      
      <div *ngIf="loading" class="loading-spinner">
        <mat-spinner></mat-spinner>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .profile-content {
      margin-top: 16px;
    }
    
    .tab-content {
      padding: 24px 16px;
    }
    
    .profile-form,
    .password-form {
      display: flex;
      flex-direction: column;
    }
    
    .form-field {
      width: 100%;
      margin-bottom: 16px;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
    
    .submit-button {
      min-width: 150px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .loading-spinner {
      display: flex;
      justify-content: center;
      margin-top: 48px;
    }
    
    .account-info {
      padding: 8px 0;
    }
    
    .info-group {
      display: flex;
      padding: 16px 0;
    }
    
    .info-label {
      font-weight: 500;
      width: 150px;
      color: #666;
    }
    
    .info-value {
      flex: 1;
    }
    
    .status {
      font-weight: 500;
    }
    
    .status.active {
      color: #4caf50;
    }
    
    .status.inactive {
      color: #f44336;
    }
  `]
})

export class ProfileComponent implements OnInit {
  user: User | null = null;
  loading = false;
  updateLoading = false;
  passwordLoading = false;
  error = '';
  passwordError = '';
  
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;
  
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit() {
    this.loading = true;
    
    // Initialize forms
    this.profileForm = this.formBuilder.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: ['']
    });
    
    this.passwordForm = this.formBuilder.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, {
      validators: this.mustMatch('newPassword', 'confirmPassword')
    });
    
    // Load user data
    this.loadUserProfile();
  }
  
  // Convenience getters for easy access to form fields
  get pf(): { [key: string]: AbstractControl } { 
    return this.profileForm.controls; 
  }
  
  get pwf(): { [key: string]: AbstractControl } { 
    return this.passwordForm.controls; 
  }
  
  // Custom validator to check if passwords match
  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        // Return if another validator has already found an error on the matchingControl
        return;
      }

      // Set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    }
  }
  
  // Load user profile
  loadUserProfile() {
    this.loading = true;
    this.error = '';
    
    this.userService.getCurrentUser(true).subscribe({
      next: user => {
        this.user = user;
        this.loading = false;
        
        // Populate the form
        this.profileForm.patchValue({
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number || ''
        });
        
        // Mark the form as pristine
        this.profileForm.markAsPristine();
      },
      error: err => {
        this.error = err.message || 'Failed to load profile';
        this.loading = false;
      }
    });
  }
  
  // Update profile
  updateProfile() {
    if (this.profileForm.invalid || !this.profileForm.dirty) {
      return;
    }
    
    this.updateLoading = true;
    this.error = '';
    
    const userData = {
      full_name: this.profileForm.value.full_name,
      email: this.profileForm.value.email,
      phone_number: this.profileForm.value.phone_number || undefined
    };
    
    this.userService.updateUser(this.user!._id, userData).subscribe({
      next: user => {
        this.user = user;
        this.updateLoading = false;
        this.notificationService.success('Profile updated successfully');
        
        // Update the auth service with new user data
        this.authService.loadCurrentUser().subscribe();
        
        // Mark the form as pristine
        this.profileForm.markAsPristine();
      },
      error: err => {
        this.error = err.message || 'Failed to update profile';
        this.updateLoading = false;
      }
    });
  }
  
  // Update password
  updatePassword() {
    if (this.passwordForm.invalid) {
      return;
    }
    
    this.passwordLoading = true;
    this.passwordError = '';
    
    const passwordData = {
      password: this.passwordForm.value.newPassword
    };
    
    // First verify current password - this is not implemented in the backend yet
    // Ideally, the backend would verify the current password before allowing update
    
    this.userService.updateUser(this.user!._id, passwordData).subscribe({
      next: () => {
        this.passwordLoading = false;
        this.notificationService.success('Password updated successfully');
        
        // Reset password form
        this.passwordForm.reset();
      },
      error: err => {
        this.passwordError = err.message || 'Failed to update password';
        this.passwordLoading = false;
      }
    });
  }
}