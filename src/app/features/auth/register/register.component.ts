// src/app/features/auth/register/register.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ErrorDisplayComponent } from '../../../shared/components/error-display/error-display.component';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ErrorDisplayComponent
  ],
  template: `
    <div class="auth-container">
      <div class="auth-card-wrapper">
        <mat-card class="auth-card">
          <mat-card-header>
            <mat-card-title>Store Management System</mat-card-title>
            <mat-card-subtitle>Create a new account</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <app-error-display
              [visible]="error !== ''"
              [message]="error"
              type="error">
            </app-error-display>
            
            <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Full Name</mat-label>
                <input 
                  matInput 
                  formControlName="full_name" 
                  placeholder="Enter your full name"
                  required>
                <mat-icon matSuffix>person</mat-icon>
                <mat-error *ngIf="f['full_name']?.errors?.['required']">Full name is required</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Email</mat-label>
                <input 
                  matInput 
                  formControlName="email" 
                  placeholder="Enter your email"
                  autocomplete="email"
                  required>
                <mat-icon matSuffix>email</mat-icon>
                <mat-error *ngIf="f['email']?.errors?.['required']">Email is required</mat-error>
                <mat-error *ngIf="f['email']?.errors?.['email']">Please enter a valid email</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Password</mat-label>
                <input 
                  matInput 
                  [type]="hidePassword ? 'password' : 'text'" 
                  formControlName="password"
                  placeholder="Enter your password"
                  autocomplete="new-password"
                  required>
                <button 
                  type="button"
                  mat-icon-button 
                  matSuffix 
                  (click)="hidePassword = !hidePassword">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="f['password']?.errors?.['required']">Password is required</mat-error>
                <mat-error *ngIf="f['password']?.errors?.['minlength']">Password must be at least 8 characters</mat-error>
              </mat-form-field>
              
              <mat-form-field appearance="outline" class="form-field">
                <mat-label>Confirm Password</mat-label>
                <input 
                  matInput 
                  [type]="hideConfirmPassword ? 'password' : 'text'" 
                  formControlName="confirmPassword"
                  placeholder="Confirm your password"
                  autocomplete="new-password"
                  required>
                <button 
                  type="button"
                  mat-icon-button 
                  matSuffix 
                  (click)="hideConfirmPassword = !hideConfirmPassword">
                  <mat-icon>{{hideConfirmPassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="f['confirmPassword']?.errors?.['required']">Confirm password is required</mat-error>
                <mat-error *ngIf="f['confirmPassword']?.errors?.['mustMatch']">Passwords must match</mat-error>
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
                  [disabled]="loading || registerForm.invalid"
                  class="submit-button">
                  <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
                  <span *ngIf="!loading">Register</span>
                </button>
              </div>
            </form>
          </mat-card-content>
          
          <mat-card-actions align="end">
            <span class="login-prompt">
              Already have an account?
              <a routerLink="/auth/login">Login</a>
            </span>
          </mat-card-actions>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background-color: #f5f5f5;
    }
    
    .auth-card-wrapper {
      width: 100%;
      max-width: 400px;
      padding: 16px;
    }
    
    .auth-card {
      width: 100%;
    }
    
    .register-form {
      display: flex;
      flex-direction: column;
      margin-top: 16px;
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
      min-width: 120px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    
    .login-prompt {
      margin-right: 16px;
      font-size: 14px;
    }
    
    @media (max-width: 600px) {
      .auth-card-wrapper {
        padding: 8px;
        max-width: 100%;
      }
    }
  `]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;
  hideConfirmPassword = true;
  
  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit() {
    this.registerForm = this.formBuilder.group({
      full_name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      phone_number: ['']
    }, {
      validators: this.mustMatch('password', 'confirmPassword')
    });
    
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate(['/']);
    }
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
  
  // Convenience getter for easy access to form fields
  get f(): { [key: string]: AbstractControl } { 
    return this.registerForm.controls; 
  }
  
  onSubmit() {
    // Stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    // Create user data object
    const userData = {
      full_name: this.f['full_name'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      phone_number: this.f['phone_number'].value || undefined
    };
    
    this.authService.register(userData).subscribe({
      next: () => {
        this.notificationService.success('Registration successful');
        this.router.navigate(['/auth/login']);
      },
      error: err => {
        this.error = err.message || 'Registration failed';
        this.loading = false;
      }
    });
  }
}