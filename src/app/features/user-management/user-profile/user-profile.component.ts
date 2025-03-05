// src/app/features/user-management/user-profile/user-profile.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { RoleService } from '../../../core/services/role.service';
import { UserWithPermissions, UserUpdate } from '../../../core/auth/models/user.model';
import { Role } from '../../../shared/models/role.model';
import { formatPermission } from '../../../shared/models/role.model';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatDividerModule,
    MatSnackBarModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>Your Profile</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="spinner-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <div *ngIf="!isLoading && currentUser">
            <div class="user-info-section">
              <h3>Account Information</h3>
              <div class="info-grid">
                <div class="info-label">Email:</div>
                <div class="info-value">{{ currentUser.email }}</div>
                
                <div class="info-label">Full Name:</div>
                <div class="info-value">{{ currentUser.full_name }}</div>
                
                <div class="info-label">Phone Number:</div>
                <div class="info-value">{{ currentUser.phone_number || 'Not provided' }}</div>
                
                <div class="info-label">Role:</div>
                <div class="info-value">
                  <!-- Handle different role formats -->
                  <span *ngIf="currentUser.role && currentUser.role.name">
                    {{ currentUser.role.name }}
                  </span>
                  <span *ngIf="!currentUser.role && currentUser.role_id">
                    {{ getRoleName(currentUser.role_id) }}
                  </span>
                  <span *ngIf="!currentUser.role && !currentUser.role_id">
                    No Role
                  </span>
                </div>
                
                <div class="info-label">Account Status:</div>
                <div class="info-value">
                  <span class="status-badge" [ngClass]="{'active': currentUser.is_active, 'inactive': !currentUser.is_active}">
                    {{ currentUser.is_active ? 'Active' : 'Inactive' }}
                  </span>
                </div>
              </div>
            </div>
            
            <mat-divider class="section-divider"></mat-divider>
            
            <div class="permissions-section" *ngIf="currentUser.permissions?.length">
              <h3>Your Permissions</h3>
              <div class="permissions-container">
                <mat-chip-listbox>
                  <mat-chip *ngFor="let permission of displayedPermissions">
                    {{ permission }}
                  </mat-chip>
                </mat-chip-listbox>
              </div>
            </div>
            
            <mat-divider class="section-divider"></mat-divider>
            
            <div class="edit-profile-section">
              <h3>Edit Profile</h3>
              <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Full Name</mat-label>
                    <input matInput formControlName="full_name">
                    <mat-error *ngIf="profileForm.get('full_name')?.hasError('required')">
                      Full name is required
                    </mat-error>
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Phone Number</mat-label>
                    <input matInput formControlName="phone_number">
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Current Password</mat-label>
                    <input matInput type="password" formControlName="current_password">
                    <mat-hint>Required only if changing password</mat-hint>
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>New Password</mat-label>
                    <input matInput type="password" formControlName="password">
                    <mat-hint>Leave blank to keep current password</mat-hint>
                    <mat-error *ngIf="profileForm.get('password')?.hasError('minlength')">
                      Password must be at least 6 characters
                    </mat-error>
                  </mat-form-field>
                </div>
                
                <div class="form-row">
                  <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Confirm New Password</mat-label>
                    <input matInput type="password" formControlName="confirm_password">
                    <mat-error *ngIf="profileForm.hasError('passwordMismatch')">
                      Passwords do not match
                    </mat-error>
                  </mat-form-field>
                </div>
                
                <div class="error-message" *ngIf="error">
                  {{ error }}
                </div>
                
                <div class="form-actions">
                  <button 
                    mat-raised-button 
                    color="primary" 
                    type="submit" 
                    [disabled]="profileForm.invalid || profileForm.pristine || isSaving"
                  >
                    {{ isSaving ? 'Updating...' : 'Update Profile' }}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </mat-card-content>
      </mat-card>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }
    
    .user-info-section, .permissions-section, .edit-profile-section {
      margin-bottom: 30px;
    }
    
    .section-divider {
      margin: 24px 0;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: 150px 1fr;
      gap: 12px;
      margin-top: 16px;
    }
    
    .info-label {
      font-weight: 500;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .info-value {
      color: rgba(0, 0, 0, 0.87);
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .active {
      background-color: #e6f7ed;
      color: #0d904f;
    }
    
    .inactive {
      background-color: #fdeded;
      color: #d32f2f;
    }
    
    .permissions-container {
      margin-top: 16px;
    }
    
    .form-row {
      margin-bottom: 16px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      margin-top: 24px;
    }
    
    .spinner-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 300px;
    }
    
    .error-message {
      color: #f44336;
      margin-top: 10px;
      margin-bottom: 10px;
      font-size: 14px;
    }
  `]
})
export class UserProfileComponent implements OnInit, OnDestroy {
  profileForm!: FormGroup;
  currentUser: UserWithPermissions | null = null;
  roles: Role[] = [];
  isLoading = false;
  isSaving = false;
  error = '';
  displayedPermissions: string[] = [];
  
  private userSubscription?: Subscription;
  
  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private roleService: RoleService,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }
  
  ngOnInit(): void {
    this.createForm();
    this.loadCurrentUser();
    this.loadRoles();
  }
  
  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }
  
  createForm(): void {
    this.profileForm = this.fb.group({
      full_name: ['', Validators.required],
      phone_number: [''],
      current_password: [''],
      password: ['', [Validators.minLength(6)]],
      confirm_password: ['']
    }, { validator: this.checkPasswords });
  }
  
  checkPasswords(group: FormGroup) {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirm_password')?.value;
    
    // Only validate if both fields have values
    if (password && confirmPassword) {
      return password === confirmPassword ? null : { passwordMismatch: true };
    }
    return null;
  }
  
  loadCurrentUser(): void {
    this.isLoading = true;
    this.error = '';
    
    this.userSubscription = this.authService.user$.subscribe({
      next: (user) => {
        if (user) {
          this.currentUser = user;
          
          // Format permissions for display (convert enum format to readable format)
          this.formatDisplayPermissions(user.permissions || []);
          
          this.profileForm.patchValue({
            full_name: user.full_name,
            phone_number: user.phone_number
          });
        }
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Error loading user profile';
        console.error('Error loading user profile', error);
        this.snackBar.open('Error loading profile: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }
  
  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        this.error = error.message || 'Error loading roles';
        console.error('Error loading roles', error);
      }
    });
  }
  
  getRoleName(roleId: string | undefined): string {
    if (!roleId) return 'No Role';
    
    const role = this.roles.find(r => r._id === roleId);
    
    // Try with different id formats if not found
    if (!role) {
      const roleByStringId = this.roles.find(r => String(r._id) === String(roleId));
      if (roleByStringId) {
        return roleByStringId.name;
      }
    }
    
    return role ? role.name : 'Unknown Role';
  }
  
  formatDisplayPermissions(permissions: string[]): void {
    // Convert permissions to readable format for display
    this.displayedPermissions = permissions.map(perm => {
      // If it's in enum format, convert to simple format
      if (perm.includes('PermissionArea.')) {
        const match = perm.match(/PermissionArea\.(\w+):PermissionAction\.(\w+)/);
        if (match && match.length === 3) {
          const [_, area, action] = match;
          return `${area.toLowerCase()}:${action.toLowerCase()}`;
        }
      }
      return perm;
    });
    
    // Remove duplicates that might result from format conversion
    this.displayedPermissions = [...new Set(this.displayedPermissions)];
  }
  
  onSubmit(): void {
    if (this.profileForm.invalid) return;
    
    this.isSaving = true;
    this.error = '';
    
    const { full_name, phone_number, current_password, password } = this.profileForm.value;
    const updateData: UserUpdate = { full_name, phone_number };
    
    // Only include password if provided
    if (password) {
      if (!current_password) {
        this.error = 'Current password is required to change password';
        this.snackBar.open(this.error, 'Close', { duration: 3000 });
        this.isSaving = false;
        return;
      }
      
      updateData.current_password = current_password;
      updateData.password = password;
    }
    
    this.userService.updateCurrentUser(updateData).subscribe({
      next: () => {
        this.isSaving = false;
        this.snackBar.open('Profile updated successfully', 'Close', { duration: 3000 });
        this.authService.loadUserProfile(); // Refresh user data
        
        // Reset form state
        this.profileForm.markAsPristine();
        this.profileForm.get('current_password')?.setValue('');
        this.profileForm.get('password')?.setValue('');
        this.profileForm.get('confirm_password')?.setValue('');
      },
      error: (error) => {
        this.isSaving = false;
        this.error = error.message || 'Error updating profile';
        console.error('Error updating profile', error);
        this.snackBar.open('Error updating profile: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }
}