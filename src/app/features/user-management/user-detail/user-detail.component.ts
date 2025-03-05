// src/app/features/user-management/user-detail/user-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { UserService } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserCreate, UserUpdate } from '../../../core/auth/models/user.model';
import { Role } from '../../../shared/models/role.model';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    RouterModule
  ],
  template: `
    <div class="container">
      <mat-card>
        <mat-card-header>
          <mat-card-title>{{ isNewUser ? 'Create User' : 'Edit User' }}</mat-card-title>
        </mat-card-header>
        
        <mat-card-content>
          <div class="spinner-container" *ngIf="isLoading">
            <mat-spinner diameter="40"></mat-spinner>
          </div>
          
          <form [formGroup]="userForm" (ngSubmit)="onSubmit()" *ngIf="!isLoading">
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Email</mat-label>
                <input matInput formControlName="email" [readonly]="!isNewUser">
                <mat-error *ngIf="userForm.get('email')?.hasError('required')">
                  Email is required
                </mat-error>
                <mat-error *ngIf="userForm.get('email')?.hasError('email')">
                  Please enter a valid email
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Full Name</mat-label>
                <input matInput formControlName="full_name">
                <mat-error *ngIf="userForm.get('full_name')?.hasError('required')">
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
            
            <div class="form-row" *ngIf="isNewUser">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Password</mat-label>
                <input matInput type="password" formControlName="password">
                <mat-error *ngIf="userForm.get('password')?.hasError('required')">
                  Password is required
                </mat-error>
                <mat-error *ngIf="userForm.get('password')?.hasError('minlength')">
                  Password must be at least 6 characters
                </mat-error>
              </mat-form-field>
            </div>
            
            <div class="form-row">
              <mat-form-field appearance="outline" class="full-width">
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
              <mat-checkbox formControlName="is_active">Active</mat-checkbox>
            </div>
            
            <div class="error-message" *ngIf="error">
              {{ error }}
            </div>
            
            <div class="form-actions">
              <button mat-button [routerLink]="['/users']">Cancel</button>
              <button mat-raised-button color="primary" type="submit" [disabled]="userForm.invalid || isSaving">
                {{ isSaving ? 'Saving...' : (isNewUser ? 'Create' : 'Update') }}
              </button>
            </div>
          </form>
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
    
    .form-row {
      margin-bottom: 20px;
    }
    
    .full-width {
      width: 100%;
    }
    
    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
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
export class UserDetailComponent implements OnInit {
  userForm!: FormGroup;
  userId: string | null = null;
  isNewUser = true;
  isLoading = false;
  isSaving = false;
  error = '';
  roles: Role[] = [];
  
  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) { }
  
  ngOnInit(): void {
    this.createForm();
    this.loadRoles();
    
    this.userId = this.route.snapshot.paramMap.get('id');
    
    if (this.userId && this.userId !== 'new') {
      this.isNewUser = false;
      this.loadUser(this.userId);
    }
  }
  
  createForm(): void {
    this.userForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      full_name: ['', Validators.required],
      phone_number: [''],
      password: ['', this.isNewUser ? [Validators.required, Validators.minLength(6)] : []],
      role_id: [null],
      is_active: [true]
    });
  }
  
  loadUser(userId: string): void {
    this.isLoading = true;
    this.error = '';
    
    this.userService.getUser(userId).subscribe({
      next: (user) => {
        this.userForm.patchValue({
          email: user.email,
          full_name: user.full_name,
          phone_number: user.phone_number,
          role_id: user.role_id,
          is_active: user.is_active
        });
        
        // Remove password validation for existing users
        this.userForm.get('password')?.clearValidators();
        this.userForm.get('password')?.updateValueAndValidity();
        
        this.isLoading = false;
      },
      error: (error) => {
        this.isLoading = false;
        this.error = error.message || 'Error loading user';
        console.error('Error loading user', error);
        this.snackBar.open('Error loading user: ' + this.error, 'Close', { duration: 3000 });
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
        this.snackBar.open('Error loading roles: ' + this.error, 'Close', { duration: 3000 });
      }
    });
  }
  
  onSubmit(): void {
    if (this.userForm.invalid) return;
    
    this.isSaving = true;
    this.error = '';
    
    const formData = { ...this.userForm.value };
    
    // Remove empty password for existing users
    if (!this.isNewUser && !formData.password) {
      delete formData.password;
    }
    
    // Ensure role_id is a string or null
    if (formData.role_id) {
      formData.role_id = formData.role_id.toString();
    }
    
    if (this.isNewUser) {
      const userData: UserCreate = formData;
      
      this.userService.createUser(userData).subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('User created successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/users']);
        },
        error: (error) => {
          this.isSaving = false;
          this.error = error.message || 'Error creating user';
          console.error('Error creating user', error);
          this.snackBar.open('Error creating user: ' + this.error, 'Close', { duration: 3000 });
        }
      });
    } else {
      const userData: UserUpdate = formData;
      
      this.userService.updateUser(this.userId!, userData).subscribe({
        next: () => {
          this.isSaving = false;
          this.snackBar.open('User updated successfully', 'Close', { duration: 3000 });
          this.router.navigate(['/users']);
        },
        error: (error) => {
          this.isSaving = false;
          this.error = error.message || 'Error updating user';
          console.error('Error updating user', error);
          this.snackBar.open('Error updating user: ' + this.error, 'Close', { duration: 3000 });
        }
      });
    }
  }
}