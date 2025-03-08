// src/app/features/user-management/user-form/user-form.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { UserService } from '../../../core/services/user.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CardContainerComponent } from '../../../shared/components/card-container/card-container.component';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';
import { UserCreate, UserUpdate } from '../../../shared/models/user.model';
import { Role } from '../../../shared/models/role.model';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatSlideToggleModule,
    PageHeaderComponent,
    CardContainerComponent,
    ErrorDisplayComponent
  ],
  template: `
    <div class="user-form-container">
      <app-page-header 
        [title]="isEditMode ? 'Edit User' : 'Create User'" 
        [subtitle]="isEditMode ? 'Update user information' : 'Add a new user to the system'"
        [showBackButton]="true"
        backButtonLink="/users">
      </app-page-header>
      
      <app-card-container>
        <app-error-display
          [visible]="error !== ''"
          [message]="error"
          type="error">
        </app-error-display>
        
        <form [formGroup]="userForm" (ngSubmit)="onSubmit()" class="user-form">
          <!-- Personal Information Section -->
          <div class="form-section">
            <h3 class="section-title">Personal Information</h3>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Full Name</mat-label>
                <input 
                  matInput 
                  formControlName="full_name" 
                  placeholder="Enter full name"
                  required>
                <mat-error *ngIf="f['full_name']?.errors?.['required']">Full name is required</mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Email</mat-label>
                <input 
                  matInput 
                  formControlName="email" 
                  placeholder="Enter email address"
                  required>
                <mat-error *ngIf="f['email']?.errors?.['required']">Email is required</mat-error>
                <mat-error *ngIf="f['email']?.errors?.['email']">Please enter a valid email</mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Phone Number</mat-label>
                <input 
                  matInput 
                  formControlName="phone_number" 
                  placeholder="Enter phone number">
              </mat-form-field>
            </div>
          </div>
          
          <!-- Account Settings Section -->
          <div class="form-section">
            <h3 class="section-title">Account Settings</h3>
            
            <div class="form-row" *ngIf="!isEditMode">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Password</mat-label>
                <input 
                  matInput 
                  formControlName="password" 
                  type="password"
                  placeholder="Enter password"
                  [required]="!isEditMode">
                <mat-error *ngIf="f['password']?.errors?.['required']">Password is required</mat-error>
                <mat-error *ngIf="f['password']?.errors?.['minlength']">Password must be at least 8 characters</mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row" *ngIf="!isEditMode">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Confirm Password</mat-label>
                <input 
                  matInput 
                  formControlName="confirmPassword" 
                  type="password"
                  placeholder="Confirm password"
                  [required]="!isEditMode">
                <mat-error *ngIf="f['confirmPassword']?.errors?.['required']">Confirm password is required</mat-error>
                <mat-error *ngIf="f['confirmPassword']?.errors?.['mustMatch']">Passwords must match</mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Role</mat-label>
                <mat-select formControlName="role_id">
                  <mat-option [value]="null">No Role</mat-option>
                  <mat-option *ngFor="let role of roles" [value]="role._id">
                    {{ role.name }}
                  </mat-option>
                </mat-select>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-slide-toggle formControlName="is_active" color="primary">
                Active
              </mat-slide-toggle>
            </div>
          </div>
          
          <div class="form-actions">
            <button 
              mat-flat-button 
              color="primary" 
              type="submit"
              [disabled]="loading || userForm.invalid">
              {{ isEditMode ? 'Update User' : 'Create User' }}
            </button>
            <button 
              mat-stroked-button 
              type="button"
              routerLink="/users">
              Cancel
            </button>
          </div>
        </form>
      </app-card-container>
    </div>
  `,
  styles: [`
    .user-form-container {
      padding: 16px;
    }
    
    .user-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .section-title {
      margin: 0;
      font-size: 18px;
      font-weight: 500;
    }
    
    .form-row {
      display: flex;
      gap: 16px;
    }
    
    .form-field {
      flex: 1;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 16px;
    }
  `]
})
export class UserFormComponent implements OnInit {
  userForm!: FormGroup;
  userId: string = '';
  isEditMode = false;
  loading = false;
  error = '';
  roles: Role[] = [];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private notificationService: NotificationService,
    private roleService: RoleService
  ) {}
  
  ngOnInit(): void {
    this.initForm();
    this.loadRoles();
    
    // Check if we're in edit mode
    this.userId = this.route.snapshot.paramMap.get('id') || '';
    this.isEditMode = !!this.userId;
    
    if (this.isEditMode) {
      this.loadUser();
    }
  }
  
  get f(): { [key: string]: AbstractControl } {
    return this.userForm.controls;
  }
  
  initForm(): void {
    this.userForm = this.fb.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone_number: [''],
      password: ['', this.isEditMode ? [] : [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', this.isEditMode ? [] : Validators.required],
      role_id: [null],
      is_active: [true]
    }, {
      validators: this.isEditMode ? [] : [this.mustMatch('password', 'confirmPassword')]
    });
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
  
  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (roles) => {
        this.roles = roles;
      },
      error: (error) => {
        this.notificationService.error('Failed to load roles');
      }
    });
  }
  
  loadUser(): void {
    this.loading = true;
    
    this.userService.getUser(this.userId).subscribe({
      next: (user) => {
        // Remove password fields since we're editing
        this.userForm.removeControl('password');
        this.userForm.removeControl('confirmPassword');
        
        // Update form with user data
        this.userForm.patchValue({
          full_name: user.full_name,
          email: user.email,
          phone_number: user.phone_number,
          role_id: user.role_id,
          is_active: user.is_active
        });
        
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load user details';
        this.loading = false;
      }
    });
  }
  
  onSubmit(): void {
    if (this.userForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    const formData = this.userForm.value;
    
    // Remove confirm password field
    delete formData.confirmPassword;
    
    if (this.isEditMode) {
      // Update existing user
      this.updateUser(formData);
    } else {
      // Create new user
      this.createUser(formData);
    }
  }
  
  createUser(userData: UserCreate): void {
    this.userService.createUser(userData).subscribe({
      next: (user) => {
        this.notificationService.success('User created successfully');
        this.router.navigate(['/users', user._id]);
      },
      error: (error) => {
        this.error = error.message || 'Failed to create user';
        this.loading = false;
      }
    });
  }
  
  updateUser(userData: UserUpdate): void {
    this.userService.updateUser(this.userId, userData).subscribe({
      next: (user) => {
        this.notificationService.success('User updated successfully');
        this.router.navigate(['/users', user._id]);
      },
      error: (error) => {
        this.error = error.message || 'Failed to update user';
        this.loading = false;
      }
    });
  }
}