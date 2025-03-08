// src/app/features/auth/login/login.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
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
  selector: 'app-login',
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
            <mat-card-subtitle>Login to your account</mat-card-subtitle>
          </mat-card-header>
          
          <mat-card-content>
            <app-error-display
              [visible]="error !== ''"
              [message]="error"
              type="error">
            </app-error-display>
            
            <form [formGroup]="loginForm" (ngSubmit)="onSubmit()" class="login-form">
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
                  autocomplete="current-password"
                  required>
                <button 
                  type="button"
                  mat-icon-button 
                  matSuffix 
                  (click)="hidePassword = !hidePassword">
                  <mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon>
                </button>
                <mat-error *ngIf="f['password']?.errors?.['required']">Password is required</mat-error>
              </mat-form-field>
              
              <div class="form-actions">
                <button 
                  mat-flat-button 
                  color="primary" 
                  type="submit"
                  [disabled]="loading || loginForm.invalid"
                  class="submit-button">
                  <mat-spinner diameter="20" *ngIf="loading"></mat-spinner>
                  <span *ngIf="!loading">Login</span>
                </button>
              </div>
            </form>
          </mat-card-content>
          
          <mat-card-actions align="end">
            <span class="register-prompt">
              Don't have an account?
              <a routerLink="/auth/register">Register</a>
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
    
    .login-form {
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
    
    .register-prompt {
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
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error = '';
  hidePassword = true;
  returnUrl: string = '/';
  
  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {}
  
  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    // Get return URL from query params or default to home page
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
    
    // Redirect if already logged in
    if (this.authService.isAuthenticated) {
      this.router.navigate([this.returnUrl]);
    }
  }
  
  // Convenience getter for easy access to form fields
  get f(): { [key: string]: AbstractControl } { 
    return this.loginForm.controls; 
  }
  
  onSubmit() {
    console.log('Login attempt with:', {
      email: this.f['email'].value,
      passwordLength: this.f['password'].value.length
    });
    // Stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }
    
    this.loading = true;
    this.error = '';
    
    this.authService.login(
      this.f['email'].value,
      this.f['password'].value
    ).subscribe({
      next: () => {
        this.notificationService.success('Login successful');
        this.router.navigate([this.returnUrl]);
      },
      error: err => {
        this.error = err.message || 'Invalid email or password';
        this.loading = false;
      }
    });
  }

  
  
}